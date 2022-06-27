import fs from 'fs';
import path from 'path';
import md5File from 'md5-file';
import {parseYaml} from "../client/utils/yaml";
import {promisify} from 'util';
import {AppID, AppIDListOrAll, AppTopLevelConfiguration, BuildID, LoadedConfig, LoadedPage, rawAllDBConfigSchema, rawAppConfigSchema, RawBuildConfig, RawDefaultBuildConfig, rawDefaultBuildConfigSchema, rawMenuConfigSchema, ReturnedFinalConfig, returnedFinalConfigSchema} from "../client/configHandler/zodConfigTypes";
import {rawLangConfigSchema} from '../client/configHandler/zodLangConfigTypes';
import {FINAL_CONFIG_JSON_FILENAME, FINAL_CONFIG_LOCAL_DIR} from "../client/constants";
import {PrecacheEntry} from 'workbox-precaching/_types';
import {getRecordEntries, runningInJest} from '../client/utils';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const opendir = promisify(fs.opendir);
const stat = promisify(fs.stat);

// TODO(high): check that all referenced files in public actually exist
// TODO(high): ensure that directory names are alphanumeric and underscore only
// TODO(high): use webpack to generate this, instead of .env.local
// TODO(high): once using webpack, generate the json filenames with md5sum included in the filename, and use it when fetching them? certainly include the md5sum in the main fetch, since that isn't happening now
const ENV_FILE = '.env.local';
const ENV_FILE_HEADER = '# NOTE: This file is generated automatically by compileYaml.ts! ' +
    'Changes here will be overwritten during the build process.';
const CONFIG_DIR = 'src/config/';

const GENERATED_SRC_DIR = 'src/generated';

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
    "build.yml": {
        type: "defaultBuildConfig",
        schema: rawDefaultBuildConfigSchema,
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

export async function* walkFileTree(appID: "default" | AppID, dir: string, subdirs: Array<string>): AsyncIterable<LoadedFilePlusMeta | null> {
    for await (const d of await opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
            yield* walkFileTree(appID, entry, [...subdirs, d.name]);
        }
        else if (d.isFile()) {
            yield handleFile(appID, entry, d.name, subdirs);
        }
    }
}

export async function* genAppDirs(dir: string, subdirs: Array<string>, opts?: {testMode?: boolean}): AsyncIterable<AppID | null> {
    for await (const d of await opendir(dir)) {
        if (opts?.testMode !== true && subdirs[0] === "test") {
            continue;
        }
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
            const appYml = path.join(entry, "app.yml");
            try {
                const hasAppYml = (await stat(appYml)).isFile();
                if (hasAppYml) {
                    yield path.join(...subdirs, d.name);
                }
            } catch (_e) {
            }
            yield* genAppDirs(entry, [...subdirs, d.name]);
        }
    }
}

async function handleFile(appID: "default" | AppID, path: string, filename: string, subdirs: Array<string>): Promise<LoadedFilePlusMeta | null> {
    if (path.endsWith('.yml')) {
        const yamlText = (await readFile(path)).toString();
        const id = filename.replace(/.yml$/, "")
        const yamlBlob: Object = parseYaml(yamlText);

        let validatedConfig: LoadedConfig | null = null;
        try {
            validatedConfig = checkAndTagYamlConfig(filename, yamlBlob);
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
        const dialect = filename.replace(/.md$/, "")
        if (subdirs.length > 2) {
            console.error(`Markdown file too deeply nested! Unsure how to handle: "${path}"`)
            return null;
        }
        return {
            type: "page",
            meta: {
                idChain: [...subdirs, dialect],
            },
            page: {
                dialect,
                pageID: subdirs[0],
                appID,
                pageType: "markdown",
                mdText,
            }
        };
    } else {
        console.warn(`Unknown file type for: ${path}`);
        return null;
    }
}

export default function checkAndTagYamlConfig(filename: string, yamlBlob: Object): LoadedConfig | null {
    if (filename in YAML_FILENAME_TO_SCHEMA_MAPPING) {
        const m = YAML_FILENAME_TO_SCHEMA_MAPPING[filename as keyof typeof YAML_FILENAME_TO_SCHEMA_MAPPING];

        //NOTE: parsing/validation no longer happens here, it's done after everything is loaded so that we
        //      get paths. if a return to this is desired, you just need to make sure this has a way to safeparse.
        //const parsed = m.schema.parse(yamlBlob);

        const parsed = yamlBlob as ReturnType<typeof m.schema.parse>;

        // TODO: remove as
        return {
            configType: m.type,
            config: parsed,
        } as LoadedConfig;
    } else {
        console.warn(`Unknown yaml filename, ignoring: "${filename}"`);
        return null;
    }
}

// TODO: flatten out ".config" and just use discriminated unions (will greatly simplify parsing and accessing)
// TODO: separate out parsing logic for "default", since it's not just apps
export async function rawParseAppYaml(localPrefix: string, appID: "default" | AppID): Promise<any> {
    if (!runningInJest()) {
        console.info(`Building app "${appID}"...`);
    }

    const output: any = {
        appID,
        pages: [],
        configs: {},
    };

    // TODO: XXX: move this into its own function (and then parse as app separately?)
    if (appID === "default") {
        const buildDir = path.join(CONFIG_DIR, "default", "build.yml");
        const lkfPlusMeta = await handleFile(appID, buildDir, "build.yml", []);

        if (lkfPlusMeta?.type === "config") {
            output.build = lkfPlusMeta.conf;
        } else {
            console.warn(lkfPlusMeta);
            throw new Error("Error loading default build.yml!");
        }
    }

    // TODO: ensure CONFIG_DIR + localPrefix + appID is a valid path
    const appDir = path.join(CONFIG_DIR, localPrefix, appID);

    for await (const obj of walkFileTree(appID, appDir, [])) {
        if (obj === null) {
            continue;
        }
        if (obj.type === "page") {
            output.pages.push(obj.page);
        } else if (obj.type === "config") {
            output.configs[obj.conf.configType] = obj.conf;
        }
    }

    return output;
}

async function loadBuildYaml(buildID: BuildID, path: string): Promise<any> {
    const yamlText = (await readFile(path)).toString();
    const yamlBlob: any = parseYaml(yamlText);
    yamlBlob.buildID = buildID;
    return yamlBlob;
}

export async function rawParseBuildYaml(localPrefix: string, buildID: BuildID): Promise<any> {
    if (!runningInJest()) {
        console.info(`Building build ${buildID}...`);
    }

    // TODO: ensure is a valid path
    const fileName = `${buildID}/build.yml`;
    const buildPath = path.join(CONFIG_DIR, localPrefix, fileName);

    return await loadBuildYaml(buildID, buildPath);
}

export interface GLFCOpts {
    buildID?: BuildID,
    appIDsOverride?: AppIDListOrAll,
    initialAppOverride?: AppID,
}

// XXX WARNING! Intended only for use in tests.
export async function genLoadFinalConfigWILLTHROW(opts?: GLFCOpts): Promise<ReturnedFinalConfig> {
    const {buildID, appIDsOverride, initialAppOverride} = opts ?? {};
    const generatedFinalConfigAttempt = await genLoadFinalConfigAttemptINTERNAL({buildID, appIDsOverride, initialAppOverride});
    return returnedFinalConfigSchema.parse(generatedFinalConfigAttempt, {errorIncludesInputData: true});
}

export async function genLoadFinalConfigSafe(opts?: GLFCOpts): Promise<ReturnType<typeof returnedFinalConfigSchema.safeParse>> {
    const {buildID, appIDsOverride, initialAppOverride} = opts ?? {};
    const generatedFinalConfigAttempt = await genLoadFinalConfigAttemptINTERNAL({buildID, appIDsOverride, initialAppOverride});
    return returnedFinalConfigSchema.safeParse(generatedFinalConfigAttempt, {errorIncludesInputData: true});
}

// NOTE: this function returns what it thinks is a ReturnedFinalConfig, but because the yaml parsing functions return "any", we don't try to say that we have an RFC until it is parsed via zod above.
async function genLoadFinalConfigAttemptINTERNAL(opts: GLFCOpts): Promise<any> {
    const {buildID, appIDsOverride, initialAppOverride} = opts;

    const rawdef = await rawParseAppYaml("", "default");

    const buildConfig: RawBuildConfig = buildID === undefined
        ? undefined :
        await rawParseBuildYaml("builds/", buildID);

    const appIDsOrAll: AppIDListOrAll = appIDsOverride ??
        buildConfig?.apps ??
        rawdef.build.config.apps;

    let appIDs: [AppID, ...AppID[]];
    if (appIDsOrAll === "all") {
        !runningInJest() && console.info("[INFO] Allmode requested! Building all apps...");
        const ids = [];
        const appDir = path.join(CONFIG_DIR, "apps/");
        for await (const appID of genAppDirs(appDir, [])) {
            if (appID === null) {
                continue;
            } else {
                ids.push(appID);
            }
        }
        if (ids.length < 1) {
            throw new Error("Allmode requested, but no apps found in apps/!");
        } else {
            appIDs = ids as [AppID, ...AppID[]];
        }
    } else {
        appIDs = Array.from(new Set(appIDsOrAll)) as [AppID, ...AppID[]];
    }

    const apps: AppTopLevelConfiguration[] = await Promise.all(appIDs.map(async (appID: string) => {
        const rawapp = await rawParseAppYaml("apps/", appID);
        return rawapp;
    }));
    const appEntries: [AppID, AppTopLevelConfiguration][] = apps.map((a) => ([a.appID, a]));

    const generatedFinalConfigAttempt: ReturnedFinalConfig = {
        default: rawdef,
        appConfigs: Object.fromEntries(appEntries),
        buildConfig: buildConfig,
    };

    if (appIDsOverride !== undefined) {
        generatedFinalConfigAttempt.overrides = {
            initialAppOverride,
            appIDsOverride,
        };
    }
    return generatedFinalConfigAttempt;
}

export function getFilesToCache(finalObj: ReturnedFinalConfig): string[] {
    const filesToCache = [];
    for (const appName in finalObj.appConfigs) {
        const allAppConfigs = finalObj.appConfigs[appName];
        if (allAppConfigs === undefined) {
            throw new Error("Undefined appconfig: " + appName);
        }

        const {dbConfigs} = allAppConfigs.configs.dbConfig.config;

        for (const [_dbIdentifier, rawDBConfig] of getRecordEntries(dbConfigs)) {
            const loadInfo = rawDBConfig.loadInfo;
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

function getPublicPrefixes(filename: string): {withPublicPrefix: string, noPublicPrefix: string} {
    let withPublicPrefix = filename;
    if (!filename.startsWith(PUBLIC_DIR_PREFIX)) {
        withPublicPrefix = PUBLIC_DIR_PREFIX + filename;
    }
    const noPublicPrefix = withPublicPrefix.slice(PUBLIC_DIR_PREFIX.length);
    return {withPublicPrefix, noPublicPrefix};
}

export async function genPrecacheEntries(filenames: string[]): Promise<PrecacheEntry[]> {
    return Promise.all(filenames.map(async (filename) => {
        const {withPublicPrefix, noPublicPrefix} = getPublicPrefixes(filename);
        return md5File(withPublicPrefix).then((md5sum) => {
            const entry: PrecacheEntry = {
                url: noPublicPrefix,
                revision: md5sum,
            };
            return entry;
        });
    }));
}

async function genLocalURLWithMD5Version(filename: string): Promise<string> {
    const {withPublicPrefix, noPublicPrefix} = getPublicPrefixes(filename);

    if (runningInJest()) {
        return `${noPublicPrefix}?v=${noPublicPrefix}_MD5`;
    }

    return md5File(withPublicPrefix).then((md5sum) => {
        return `${noPublicPrefix}?v=${md5sum}`;
    });
}

export type IndexHtmlEnvVarPairs = {
    REACT_APP_LIBURRY_HTML_TITLE: string,
    REACT_APP_LIBURRY_HTML_THEME_COLOR: string,
    REACT_APP_LIBURRY_HTML_OG_TITLE: string,
    REACT_APP_LIBURRY_HTML_OG_IMAGE: string,
    REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: string,
    REACT_APP_LIBURRY_WEBMANIFEST_PATH: string,
    REACT_APP_LIBURRY_FAVICON_PATH: string,
} & IndexHtmlEnvVarPairsOptionals;

interface IndexHtmlEnvVarPairsOptionals {
    REACT_APP_LIBURRY_HTML_NOSCRIPT_ADDENDUM?: string,
}

export async function genIndexHTMLEnvVarPairs(
    defaultBuildConfig: RawDefaultBuildConfig,
    buildConfig?: RawBuildConfig,
): Promise<IndexHtmlEnvVarPairs> {
    // TODO: recursively overwrite defaultconfig with buildconfig
    // TODO: read in configs

    const displayName = buildConfig?.displayName ?? defaultBuildConfig.displayName;
    const themeColor = buildConfig?.indexHtml?.themeColor ?? defaultBuildConfig.indexHtml.themeColor;

    // NOTE: if the build has a displayName, use that for og:title before falling back to the default buildconfig
    // //TODO: UNIT TEST
    const title = buildConfig?.indexHtml?.og?.title ??
        buildConfig?.displayName ??
        defaultBuildConfig.indexHtml.og.title;
    const imageFullURL = buildConfig?.indexHtml?.og?.imageFullURL ?? defaultBuildConfig.indexHtml.og.imageFullURL;
    const description = buildConfig?.indexHtml?.og?.description ?? defaultBuildConfig.indexHtml.og.description;

    const manifestUNFINISHED = buildConfig?.indexHtml?.manifest ?? defaultBuildConfig.indexHtml.manifest;
    const manifest = await genLocalURLWithMD5Version(manifestUNFINISHED);
    const favicon = buildConfig?.indexHtml?.favicon ?? defaultBuildConfig.indexHtml.favicon;

    const noscript = buildConfig?.indexHtml?.noscript;

    const optionals: IndexHtmlEnvVarPairsOptionals = {};
    if (noscript !== undefined) {
        optionals.REACT_APP_LIBURRY_HTML_NOSCRIPT_ADDENDUM = noscript;
    }

    return {
        REACT_APP_LIBURRY_HTML_TITLE: displayName,
        REACT_APP_LIBURRY_HTML_THEME_COLOR: themeColor,
        REACT_APP_LIBURRY_HTML_OG_TITLE: title,
        REACT_APP_LIBURRY_HTML_OG_IMAGE: imageFullURL,
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: description,
        REACT_APP_LIBURRY_WEBMANIFEST_PATH: manifest,
        REACT_APP_LIBURRY_FAVICON_PATH: favicon,
        ...optionals,
    };

}

export function makeEnvFileEntry(varname: string, value: string) {
    // The env file is newline-delimited, so don't allow values to be passed in
    const noNewlinesValue = value.replace(/[\n\r]/g, '');
    return `${varname}=${noNewlinesValue}\n`;
}

export async function genWriteEnvFile(envFileBody: string) {
    const output = `${ENV_FILE_HEADER}\n${envFileBody}`;

    return await writeFile(ENV_FILE, output).then(
        () => console.info(`* Wrote out "${ENV_FILE}"...`));
}

export async function genWriteFinalConfig(jsonString: string) {
    return await writeFile(path.join(PUBLIC_DIR_PREFIX, FINAL_CONFIG_LOCAL_DIR, FINAL_CONFIG_JSON_FILENAME), jsonString).then(
        () => console.info(`* Wrote out "${FINAL_CONFIG_LOCAL_DIR}"...`));
}

const DEFINITIONS_DEFAULT_LANG = "eng_us";
const I18N_TYPEDEF_FILENAME = "i18n.ts";
export function getTypeScriptHelperDefinitionsFromConfig(rfc: ReturnedFinalConfig): {filename: string, contents: string, after: () => Promise<void>}[] {
    const defaultLangConfig = rfc.default.configs.langConfig.config;
    //const dialectNames = Object.keys(defaultLangConfig.dialects);
    const defaultDialect = defaultLangConfig.dialects[DEFINITIONS_DEFAULT_LANG];
    const i18nTokens = defaultDialect?.tokens;
    if (i18nTokens === undefined) {
        throw new Error(`Default language "${DEFINITIONS_DEFAULT_LANG} does not have tokens defined!"`);
    }

    const knownTokens = Object.keys(i18nTokens);


    const constArrInner = (l: Array<string>) => l.map((tok) => `"${tok}"`).join(", ");

    //const knownTokensAsZodSchemaUnionInner = knownTokens.map((tok) => `    z.literal("${tok}"),\n`).join("").trimEnd();
    //const knownTokensAsTypeUnionInner = knownTokens.map((tok) => `"${tok}"`).join(" | ");
    const knownTokensAsConstArrayInner = constArrInner(knownTokens);

    const knownDialectIDs = Object.keys(defaultLangConfig.dialects);
    //const knownDialectIDsAsTypeUnionInner = knownDialectIDs.map((tok) => `"${tok}"`).join(" | ");
    const knownDialectIDsAsConstArrayInner = constArrInner(knownDialectIDs);

    const i18nFileContents = `// ==========================================
// XXX - DO NOT EDIT THIS FILE BY HAND! - XXX
//
// Automatically generated by:
//   src/scripts/compileYamlLib.ts
//
// ==========================================

export const i18nTokenIDs = [${knownTokensAsConstArrayInner}] as const;
export const knownDialectIDs = [${knownDialectIDsAsConstArrayInner}] as const;

export const i18nTokenIDsSet = new Set(i18nTokenIDs);
export const knownDialectIDsSet = new Set(knownDialectIDs);

export type I18NToken = typeof i18nTokenIDs[number];
export type KnownDialectID = typeof knownDialectIDs[number];
`;

//export type I18NToken = ${knownTokensAsTypeUnionInner};
//export type KnownDialectID = ${knownDialectNamesAsTypeUnionInner};
//import {z} from "@mrawesome/zod";
//export const i18nTokensSchema = z.union([
//${knownTokensAsZodSchemaUnionInner}
//]);
//export type I18NToken = z.infer<typeof i18nTokensSchema>;

    const langOutFile = {
        filename: path.join(GENERATED_SRC_DIR, I18N_TYPEDEF_FILENAME),
        contents: i18nFileContents,
        after: async () => console.info(`[INFO] Wrote out internationalization type definition file "${I18N_TYPEDEF_FILENAME}"`),
    };

// Can write out the raw default config and infer types from it, but it's slower and also
// introduces the chance of someone trying to use hard-coded values from it instead of the actual config
//
//    const jsonDefaultConfigText = JSON.stringify(rfc.default.configs.langConfig.config);
//
//    const jsonOutFile = {
//        filename: path.join(GENERATED_SRC_DIR, "i18n.json"),
//        contents: jsonDefaultConfigText,
//        after: async () => console.info(`[INFO] Wrote out JSON default config for type awareness.`),
//    }

    return [langOutFile];
}

export async function genWriteGivenFiles(files: {filename: string, contents: string, after: () => Promise<void>}[]) {
    return Promise.all(files.map(async ({filename, contents, after}) => await writeFile(filename, contents).then(after)));
}
