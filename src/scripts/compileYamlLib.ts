import fs from 'fs';
import path from 'path';
import md5File from 'md5-file';
import {parseYaml} from "../utils/yaml";
import {promisify} from 'util';
import {AppID, AppTopLevelConfiguration, appTopLevelConfigurationSchema, DefaultTopLevelConfiguration, defaultTopLevelConfigurationSchema, LoadedConfig, LoadedPage, rawAllDBConfigSchema, rawAppConfigSchema, rawLangConfigSchema, rawMenuConfigSchema, ReturnedFinalConfig, returnedFinalConfigSchema} from "../configHandler/zodConfigTypes";
import {CHHA_APPNAME, FINAL_CONFIG_JSON_FILENAME, FINAL_CONFIG_LOCAL_DIR} from "../constants";
import {PrecacheEntry} from 'workbox-precaching/_types';
import {getRecordEntries, runningInJest} from '../utils';
import {DBConfig} from '../types/config';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const opendir = promisify(fs.opendir);

// TODO(high): use webpack to generate this, instead of .env.local
// TODO(high): once using webpack, generate the json filenames with md5sum included in the filename, and use it when fetching them? certainly include the md5sum in the main fetch, since that isn't happening now
const ENV_FILE = '.env.local';
const ENV_FILE_HEADER = '# NOTE: This file is generated automatically by compileYaml.ts! ' +
    'Changes here will be overwritten during the build process.';
const CONFIG_DIR = 'src/config/';

const PUBLIC_DIR_PREFIX = 'public/';

export const YAML_FILENAME_TO_SCHEMA_MAPPING = {
    "app.yml": {
        type: "appConfig",
        schema: rawAppConfigSchema,
    },
    "db.yml": {
        type: "dbConfig",
        schema: rawAllDBConfigSchema,
    },
    "lang.yml": {
        type: "langConfig",
        schema: rawLangConfigSchema,
    },
    "menu.yml": {
        type: "menuConfig",
        schema: rawMenuConfigSchema,
    }
} as const;

interface LKFMeta {
    idChain: string[],
}
type LoadedFilePlusMeta = {
    type: "config",
    conf: LoadedConfig,
    meta: LKFMeta,
} | {
    type: "page",
    page: LoadedPage,
    meta: LKFMeta,
};

export async function* walkFileTree(dir: string, subdirs: Array<string>): AsyncIterable<LoadedFilePlusMeta | null> {
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

async function handleFile(path: string, filename: string, subdirs: Array<string>): Promise<LoadedFilePlusMeta | null> {
    if (path.endsWith('.yml')) {
        const yamlText = (await readFile(path)).toString();
        const id = filename.replace(/.yml$/, "")
        const yamlBlob: Object = parseYaml(yamlText);

        let validatedConfig: LoadedConfig | null = null;
        try {
            validatedConfig = validateYaml(filename, yamlBlob);
        } catch (e) {
            console.error(`Failed validating "${path}":`);
            throw e;
        }

        if (validatedConfig !== null) {
            return {
                type: "config",
                meta: {
                    idChain: [...subdirs, id],
                },
                conf: validatedConfig,
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
            meta: {
                idChain: [...subdirs, lang],
            },
            page: {
                lang,
                pageID: subdirs[0],
                pageType: "markdown",
                mdText,
            }
        };
    } else {
        console.warn(`Unknown file type for: ${path}`);
        return null;
    }
}

export default function validateYaml(filename: string, yamlBlob: Object): LoadedConfig | null {
    if (filename in YAML_FILENAME_TO_SCHEMA_MAPPING) {
        const m = YAML_FILENAME_TO_SCHEMA_MAPPING[filename as keyof typeof YAML_FILENAME_TO_SCHEMA_MAPPING];
        // NOTE: could use safeparse instead. Just felt convenient.
        const parsed = m.schema.parse(yamlBlob);

        return {
            configType: m.type,
            config: parsed,
        } as LoadedConfig;
    } else {
        console.log(`Unknown yaml filename, ignoring: "${filename}"`);
        return null;
    }
}

export async function rawParseYaml(localPrefix: string, appID: "default" | AppID): Promise<any> {
    if (!runningInJest()) {
        console.log(`Building app ${appID}...`);
    }

    const output: any = {
        appID,
        pages: {},
        configs: {},
    };

    // TODO: ensure CONFIG_DIR + localPrefix + appID is a valid path
    const appDir = path.join(CONFIG_DIR, localPrefix, appID);

    for await (const obj of walkFileTree(appDir, [])) {
        if (obj === null) {
            continue;
        }
        if (obj.type === "page") {
            output.pages[obj.page.pageID] = obj.page;
        } else if (obj.type === "config") {
            output.configs[obj.conf.configType] = obj.conf;
        }
    }

    return output;
}

function parseDefaultApp(obj: any): DefaultTopLevelConfiguration {
    return defaultTopLevelConfigurationSchema.parse(obj, {path: ["default"]});
}

function parseApp(obj: any): AppTopLevelConfiguration {
    return appTopLevelConfigurationSchema.parse(obj, {path: ["apps", obj.appID]});
}

export async function loadFinalConfigForApps(appIDs: AppID[]): Promise<ReturnedFinalConfig> {
    const rawdef = await rawParseYaml("", "default");
    const def = parseDefaultApp(rawdef);
    const apps: AppTopLevelConfiguration[] = await Promise.all(appIDs.map(async (appID) => {
        const rawapp = await rawParseYaml("apps/", appID);
        const app = parseApp(rawapp);
        return app;
    }));
    const appEntries: [AppID, AppTopLevelConfiguration][] = apps.map((a) => ([a.appID, a]));
    const generatedFinalConfigAttempt: any = {
        default: def,
        apps: Object.fromEntries(appEntries),
    };
    return returnedFinalConfigSchema.parse(generatedFinalConfigAttempt);
}

export function getFilesToCache(finalObj: ReturnedFinalConfig): string[] {
    const filesToCache = [];
    for (const appName in finalObj.apps) {
        const allAppConfigs = finalObj.apps[appName];
        if (allAppConfigs === undefined) {
            throw new Error("Undefined appconfig: " + appName);
        }

        const {dbConfigs} = allAppConfigs.configs.dbConfig.config;

        for (const [dbIdentifier, rawDBConfig] of getRecordEntries(dbConfigs)) {
            const dbConfig = new DBConfig(dbIdentifier, rawDBConfig);

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
    return filesToCache;
}

export async function genPrecacheEntries(filenames: string[]): Promise<PrecacheEntry[]> {
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

export function makeEnvFileEntry(varname: string, value: string) {
    // The env file is newline-delimited, so don't allow values to be passed in
    const noNewlinesValue = value.replace(/[\n\r]/g, '');
    return `${varname}=${noNewlinesValue}\n`;
}

export async function genWriteEnvFile(envFileBody: string) {
    const output = `${ENV_FILE_HEADER}\n${envFileBody}`;

    writeFile(ENV_FILE, output).then(
        () => console.log(`* Wrote out "${ENV_FILE}"...`));
}

export async function genWriteFinalConfig(jsonString: string) {
    return writeFile(path.join(PUBLIC_DIR_PREFIX, FINAL_CONFIG_LOCAL_DIR, FINAL_CONFIG_JSON_FILENAME), jsonString).then(
        () => console.log(`* Wrote out "${FINAL_CONFIG_LOCAL_DIR}"...`));
}
