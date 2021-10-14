// A script to take our yaml configs and compile them into JSON blobs for reading by the site.
//
// NOTE: currently this compiles everything, including markdown pages, into a single huge JSON blob. This can easily be split up, including compiling the config for each known app separately.

const fs = require("fs");
const path = require("path");
import {parseYaml} from "../utils/yaml";
import {promisify} from 'util';
import validateYaml from "./validateYaml";
import {LoadedKnownFile, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const opendir = promisify(fs.opendir);

const CONFIG_DIR = 'public/config/';
const CONFIG_TARGET_JSON = 'build/fullConfiguration.json';

export async function* walk(dir: string, subdirs: Array<string>): AsyncIterable<LoadedKnownFile | null> {
    for await (const d of await opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
            yield* walk(entry, [...subdirs, d.name]);
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
            console.warn(`Unknown yaml file type! Add it to YAML_FILE_SCHEMA_MAPPING if it should be parsed: "${path}"`)
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
            pageName: subdirs[1],
            idChain: [...subdirs, lang],
            lang,
            pageType: "markdown",
            mdText,
        }
    } else {
        console.warn(`Unknown file type for: ${path}`);
        return null;
    }
}

export async function parseAllYaml(): Promise<ReturnedFinalConfig> {
    const finalObj: ReturnedFinalConfig = {
        apps: {},
    };

    for await (const obj of walk(CONFIG_DIR, [])) {
        if (obj === null) {
            continue;
        }
        if (!(obj.app in finalObj.apps)) {
            finalObj.apps[obj.app] = {
                pages: {},
                configs: {},
            };
        }
        const appObj = finalObj.apps[obj.app];
        if (obj.type === "page") {
            appObj.pages[obj.pageName] = obj;
        } else if (obj.type === "config") {
            appObj.configs[obj.configType] = obj;
        }
    }
    return finalObj;
}

(async function () {
    const finalObj = await parseAllYaml();
    const jsonOut = JSON.stringify(finalObj);
    await writeFile(CONFIG_TARGET_JSON, jsonOut);
}());
