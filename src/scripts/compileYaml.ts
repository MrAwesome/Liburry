// A script to take our yaml configs and compile them into JSON blobs for reading by the site.
//
// NOTE: currently this compiles everything, including markdown pages, into a single huge JSON blob. This can easily be split up, including compiling the config for each known app separately.

const fs = require("fs");
const path = require("path");
import {parseYaml} from "../utils/yaml";
import {promisify} from 'util';
import validateYaml from "./validateYaml";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const opendir = promisify(fs.opendir);

type ReturnedConfig =
    { type: "yaml", id: string, parentIDs: Array<string>, obj: Object } |
    { type: "markdown", id: string, parentIDs: Array<string>, lang: string, mdText: string };

export async function* walk(dir: string, subdirs: Array<string>): AsyncIterable<ReturnedConfig> {
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

async function handleFile(path: string, filename: string, subdirs: Array<string>): Promise<ReturnedConfig> {
    if (path.endsWith('.yml')) {
        const yamlText = (await readFile(path)).toString();
        const id = filename.replace(/.yml$/, "")
        const obj: Object = parseYaml(yamlText);
        validateYaml(filename, obj);
        return { type: "yaml", id, parentIDs: subdirs,  obj };
    } else if (path.endsWith('.md')) {
        const mdText = (await readFile(path)).toString();
        const lang = filename.replace(/.md$/, "")
        return { type: "markdown", id: lang, parentIDs: subdirs, lang, mdText }
    } else {
        throw new Error(`Unknown file type for: ${path}`);
    }
}

interface FinalObj {
    [s: string]: FinalObj | ReturnedConfig;
}

interface TargetObj {
    [s: string]: TargetObj;
}

export async function parseAllYaml(): Promise<FinalObj> {
    const obj: FinalObj = {};
    let targetObj: FinalObj | ReturnedConfig = obj;
    for await (const configObj of walk('public/config/', [])) {
        const {parentIDs, id} = configObj;
        parentIDs.forEach((parentID) => {
            const to = targetObj as TargetObj;
            if (to[parentID] === undefined) {
                to[parentID] = {};
            }
            targetObj = to[parentID];
        });
        targetObj[id] = configObj;
        targetObj = obj;
    }
    console.log(obj);
    return obj;
}

(async function() {
  const obj = await parseAllYaml();
  const jsonOut = JSON.stringify(obj);
  await writeFile("build/fullConfiguration.json", jsonOut);
}());
