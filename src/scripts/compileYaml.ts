// A script to take our yaml configs and compile them into JSON blobs for reading by the site.
//
// NOTE: currently this compiles everything, including markdown pages, into a single huge JSON blob. This can easily be split up, including compiling the config for each known app separately.

import fs from 'fs';
import {promisify} from 'util';
import {ReturnedFinalConfig} from '../client/configHandler/zodConfigTypes';
import {FINAL_CONFIG_JSON_FILENAME, FINAL_CONFIG_LOCAL_DIR, LIBURRY_BUILD, LIBURRY_APPS_OVERRIDE} from '../client/constants';
import {CACHE_LINE_ENV_VARNAME} from './common';
import {genPrecacheEntries, genWriteEnvFile, genWriteFinalConfig, getFilesToCache, genIndexHTMLEnvVarPairs, makeEnvFileEntry, genLoadFinalConfigWILLTHROW} from './compileYamlLib';
const mkdir = promisify(fs.mkdir);

(async function () {
    // TODO: abstract away, use webpack, etc
    if (!fs.existsSync("public/generated")) {
        await mkdir("public/generated");
    }

    // TODO: write out a "build" config that lists all the apps built
    // TODO(urgent): ensure appName actually points to a directory?
    // [] write out appname as directory in generated
    // [] write out default config (where should it be?)
    // go back to writing out the entire config, and still just fetch the one big config - it's not bad to fetch all configs for all apps, you just maybe don't have to pre-load every app's dbs (should you preload subapp dbs? how to decide?)
    const buildID = LIBURRY_BUILD;
    const appIDsOverride = LIBURRY_APPS_OVERRIDE;
    const checkedFinalConfig: ReturnedFinalConfig = await genLoadFinalConfigWILLTHROW({buildID, appIDsOverride});

    // This must be written before the env file, since we generate an md5sum of the json file for precaching
    const finalObjJsonString = JSON.stringify(checkedFinalConfig);
    await genWriteFinalConfig(finalObjJsonString);

    const filesToCache = [
        ...getFilesToCache(checkedFinalConfig),
        FINAL_CONFIG_LOCAL_DIR + FINAL_CONFIG_JSON_FILENAME,
    ];
    const precacheEntries = await genPrecacheEntries(filesToCache);
    const precacheEntriesJsonString = JSON.stringify(precacheEntries);

    const defaultBuildConfig = checkedFinalConfig.default.build.config;

    if (LIBURRY_BUILD !== undefined) {
        // XXX warn here if both are undefined?
    }

    const buildConfig = checkedFinalConfig.buildConfig;

    const indexHtmlEnvVarPairs = await genIndexHTMLEnvVarPairs(defaultBuildConfig, buildConfig);
    let envFileOutputText = "";
    envFileOutputText += makeEnvFileEntry(CACHE_LINE_ENV_VARNAME, precacheEntriesJsonString);
    let envVarName: keyof typeof indexHtmlEnvVarPairs;
    for (envVarName in indexHtmlEnvVarPairs) {
        const envVarVal = indexHtmlEnvVarPairs[envVarName];
        if (envVarVal !== undefined) {
            envFileOutputText += makeEnvFileEntry(envVarName, envVarVal);
        }
    }

    await genWriteEnvFile(envFileOutputText);
    console.log("DONE.");
}());
