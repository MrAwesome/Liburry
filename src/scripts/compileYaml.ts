// A script to take our yaml configs and compile them into JSON blobs for reading by the site.
//
// NOTE: currently this compiles everything, including markdown pages, into a single huge JSON blob. This can easily be split up, including compiling the config for each known app separately.

import fs from 'fs';
import path from 'path';
import md5File from 'md5-file';
import {parseYaml} from "../utils/yaml";
import {promisify} from 'util';
import {LoadedConfig, LoadedKnownFile, RawAllDBConfig, rawAllDBConfigSchema, rawAppConfigSchema, rawLangConfigSchema, rawMenuConfigSchema, ReturnedFinalConfig, returnedFinalConfigSchema} from "../configHandler/zodConfigTypes";
import {CHHA_APPNAME, CONFIG_TARGET_JSON_FILENAME} from "../constants";
import {PrecacheEntry} from 'workbox-precaching/_types';
import {getRecordEntries, getRecordValues} from '../utils';
import {DBConfig} from '../types/config';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const opendir = promisify(fs.opendir);

const ENV_FILE = '.env.local';
const ENV_FILE_HEADER = '# NOTE: This file is generated automatically by compileYaml.ts! ' +
                        'Changes here will be overwritten during the build process.';
const CONFIG_DIR = 'public/config/';

// TODO: DB filenames are currently stored in public/db/, but their filenames are prefixed with db/ in the configs - they should probably be stored per-app, unless sharing will be common
const PUBLIC_DIR_PREFIX = 'public/';
const CACHE_LINE_ENV_VARNAME = 'REACT_APP_CHHA_CACHE_FILES_JSON';

export const YAML_FILENAME_TO_SCHEMA_MAPPING = {
    "app.yml": {
        type: "app_config",
        schema: rawAppConfigSchema,
    },
    "db.yml": {
        type: "db_config",
        schema: rawAllDBConfigSchema,
    },
    "lang.yml": {
        type: "lang_config",
        schema: rawLangConfigSchema,
    },
    "menu.yml": {
        type: "menu_config",
        schema: rawMenuConfigSchema,
    }
} as const;

export async function* walkFileTree(dir: string, subdirs: Array<string>): AsyncIterable<LoadedKnownFile | null> {
    for await (const d of await opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
            yield* walkFileTree(entry, [...subdirs, d.name]);
        }
        else if (d.isFile()) {
            yield handleFile(entry, d.name, subdirs);
        }
    }
}

async function handleFile(path: string, filename: string, subdirs: Array<string>): Promise<LoadedKnownFile | null> {
    if (path.endsWith('.yml')) {
        const yamlText = (await readFile(path)).toString();
        const id = filename.replace(/.yml$/, "")
        const yamlBlob: Object = parseYaml(yamlText);
        const validatedConfig = validateYaml(filename, yamlBlob);
        if (validatedConfig !== null) {
            return {
                type: "config",
                app: subdirs[0],
                idChain: [...subdirs, id],
                ...validatedConfig
            };
        } else {
            console.warn(`Unknown yaml file type! Add it to YAML_FILENAME_TO_SCHEMA_MAPPING if it should be parsed: "${path}"`)
            return null;
        }
    } else if (path.endsWith('.md')) {
        const mdText = (await readFile(path)).toString();
        const lang = filename.replace(/.md$/, "")
        if (subdirs.length > 2) {
            console.error(`Markdown file too deeply nested! Unsure how to handle: "${path}"`)
            return null;
        }
        return {
            type: "page",
            app: subdirs[0],
            idChain: [...subdirs, lang],
            lang,
            pageID: subdirs[1],
            pageType: "markdown",
            mdText,
        }
    } else {
        console.warn(`Unknown file type for: ${path}`);
        return null;
    }
}

// TODO:
// 1) Warn on unused languages
// 2) Error on defined languages with missing fields
export default function validateYaml(filename: string, yamlBlob: Object): LoadedConfig | null {
    if (filename in YAML_FILENAME_TO_SCHEMA_MAPPING) {
        const m = YAML_FILENAME_TO_SCHEMA_MAPPING[filename as keyof typeof YAML_FILENAME_TO_SCHEMA_MAPPING];
        return {
            type: "config",
            configType: m.type,
            config: m.schema.parse(yamlBlob),
        } as LoadedConfig;
    } else {
        return null;
    }
}

export async function parseAllYaml(): Promise<ReturnedFinalConfig> {
    const appName = CHHA_APPNAME;
    console.log(`Building app ${appName}...`);

    const constructedObj: ReturnedFinalConfig = {
        apps: {},
    };

    for await (const obj of walkFileTree(CONFIG_DIR, [])) {
        if (obj === null) {
            continue;
        }
        if (!(obj.app in constructedObj.apps)) {
            constructedObj.apps[obj.app] = {
                pages: {},
                configs: {},
            };
        }
        const appObj = constructedObj.apps[obj.app]!;
        if (obj.type === "page") {
            appObj.pages[obj.pageID] = obj;
        } else if (obj.type === "config") {
            appObj.configs = {...appObj.configs, [obj.configType]: obj};
        }
    }

    const trimmedObj: ReturnedFinalConfig = {apps: {}};

    if (!(appName in constructedObj.apps)) {
        throw new Error(`App "${appName}" not found! Check that you're setting the environment variable REACT_APP_CHHA_APPNAME correctly.`);
    }
    if (!("default" in constructedObj.apps)) {
        throw new Error(`No "default" configuration found! Check that the "default" directory exists in ${CONFIG_DIR}.`);
    }
    trimmedObj.apps["default"] = constructedObj.apps["default"];
    trimmedObj.apps[appName] = constructedObj.apps[appName];

    return trimmedObj;
}

function getFilesToCache(finalObj: ReturnedFinalConfig): string[] {
    const filesToCache = [];
    for (const appName in finalObj.apps) {
        const appConfig = finalObj.apps[appName];
        if (appConfig === undefined) {
           throw new Error("Undefined appconfig: " + appName);
        }

        for (const {configType, config} of getRecordValues(appConfig.configs)) {
            if (configType === "db_config") {
                const allDBConfigs = (config as RawAllDBConfig).dbs;
                for (const [dbIdentifier, rawDBConfig] of getRecordEntries(allDBConfigs)) {
                    const dbConfig = new DBConfig(dbIdentifier, rawDBConfig);
                    if (dbConfig.isEnabled()) {
                        const loadInfo = dbConfig.getDBLoadInfo();
                        for (const key in loadInfo) {
                            const validKey = key as keyof typeof loadInfo;
                            if (key.startsWith("local")) {
                                const localFilename = loadInfo[validKey];
                                if (localFilename !== undefined) {
                                    filesToCache.push(localFilename);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return filesToCache;
}

async function genPrecacheEntries(filenames: string[]): Promise<PrecacheEntry[]> {
    return Promise.all(filenames.map(async (filename) => {
        let withPublicPrefix = filename;
        if (!filename.startsWith(PUBLIC_DIR_PREFIX)) {
            withPublicPrefix = PUBLIC_DIR_PREFIX + filename;
        }
        const noPublicPrefix = withPublicPrefix.slice(PUBLIC_DIR_PREFIX.length);
        return md5File(withPublicPrefix).then((md5sum) => {
            const entry: PrecacheEntry = {
                url: noPublicPrefix,
                revision: md5sum,
                //integrity: ,
            };
            return entry;
        });
    }));
}

function makeEnvFileEntry(varname: string, value: string) {
    // The env file is newline-delimited, so don't allow values to be passed in
    const noNewlinesValue = value.replace(/[\n\r]/g, '');
    return `${varname}=${noNewlinesValue}\n`;
}

async function genWriteEnvFile(envFileBody: string) {
    const output = `${ENV_FILE_HEADER}\n${envFileBody}`;

    writeFile(ENV_FILE, output).then(
        () => console.log(`* Wrote out "${ENV_FILE}"...`));
}

async function genWriteFinalConfig(jsonString: string) {
    writeFile(PUBLIC_DIR_PREFIX + CONFIG_TARGET_JSON_FILENAME, jsonString).then(
            () => console.log(`* Wrote out "${CONFIG_TARGET_JSON_FILENAME}"...`));
}

(async function () {
    const generatedFinalConfig = await parseAllYaml();
    const checkedFinalConfig = returnedFinalConfigSchema.parse(generatedFinalConfig);

    // This must be written before the env file, since we generate an md5sum of the json file for precaching
    const finalObjJsonString = JSON.stringify(checkedFinalConfig);
    await genWriteFinalConfig(finalObjJsonString);

    const filesToCache = [
        ...getFilesToCache(checkedFinalConfig),
        CONFIG_TARGET_JSON_FILENAME
    ];
    const precacheEntries = await genPrecacheEntries(filesToCache);
    const precacheEntriesJsonString = JSON.stringify(precacheEntries);
    const envFileOutputText = makeEnvFileEntry(CACHE_LINE_ENV_VARNAME, precacheEntriesJsonString);

    await genWriteEnvFile(envFileOutputText);
}());

// NOTE: if you don't mind locking into the app model, everything you want to read from the config can be passed in via env vars, and you don't have to bother with the fullconfiguration at all (or it can even be in an env var (check max length of env vars))
