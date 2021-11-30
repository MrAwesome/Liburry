// A script to take our yaml configs and compile them into JSON blobs for reading by the site.
//
// NOTE: currently this compiles everything, including markdown pages, into a single huge JSON blob. This can easily be split up, including compiling the config for each known app separately.

import fs from 'fs';
import {promisify} from 'util';
import {ReturnedFinalConfig} from '../configHandler/zodConfigTypes';
import {FINAL_CONFIG_JSON_FILENAME, FINAL_CONFIG_LOCAL_DIR} from '../constants';
import {genPrecacheEntries, genWriteEnvFile, genWriteFinalConfig, getFilesToCache, loadFinalConfigForApps, makeEnvFileEntry} from './compileYamlLib';
const mkdir = promisify(fs.mkdir);

const CACHE_LINE_ENV_VARNAME = 'REACT_APP_CHHA_CACHE_FILES_JSON';

(async function () {
    // TODO: abstract away
    if (!fs.existsSync("public/generated")) {
        await mkdir("public/generated");
    }

    // TODO: write out a "build" config that lists all the apps built
    // TODO(urgent): ensure appName is a valid directory name!
    // [] write out appname as directory in generated
    // [] write out default config (where should it be?)
    // [] disallow commas in appnames
    // go back to writing out the entire config, and still just fetch the one big config - it's not bad to fetch all configs for all apps, you just maybe don't have to pre-load every app's dbs (should you preload subapp dbs? how to decide?)
    // XXX XXX XXX
    console.warn("Using hardcoded list of appnames!")
    const appIDs = ["taigi.us", "test/simpletest"];
    const checkedFinalConfig: ReturnedFinalConfig = await loadFinalConfigForApps(appIDs);

    // This must be written before the env file, since we generate an md5sum of the json file for precaching
    const finalObjJsonString = JSON.stringify(checkedFinalConfig);
    await genWriteFinalConfig(finalObjJsonString);

    const filesToCache = [
        ...getFilesToCache(checkedFinalConfig),
        FINAL_CONFIG_LOCAL_DIR + FINAL_CONFIG_JSON_FILENAME,
    ];
    const precacheEntries = await genPrecacheEntries(filesToCache);
    const precacheEntriesJsonString = JSON.stringify(precacheEntries);
    const envFileOutputText = makeEnvFileEntry(CACHE_LINE_ENV_VARNAME, precacheEntriesJsonString);

    await genWriteEnvFile(envFileOutputText);
}());


// NOTE: if you don't mind locking into the app model, everything you want to read from the config can be passed in via env vars, and you don't have to bother with the fullconfiguration at all (or it can even be in an env var (check max length of env vars))
