import fs from 'fs';
import yaml from "yaml";
import {promisify} from 'util';

const PUBLIC_PREFIX = "public/";

export async function loadYaml<T>(url: string, localMode: boolean): Promise<T> {
    const textProm = loadYamlText(url, localMode);
    return textProm.then((yamlText) => parseYaml(yamlText));
}

export async function loadYamlText(url: string, localMode: boolean): Promise<string> {
    let prom;
    if (localMode) {
        const readFile = promisify(fs.readFile);
        prom = readFile(PUBLIC_PREFIX + url, null).then((r) => r.toString());
    } else {
        prom = fetch(url).then((r) => r.text());
    }
    return prom;
}

export async function loadTestYaml<T>(filename: string): Promise<T> {
    const readFile = promisify(fs.readFile);
    return readFile(filename, null).then((r) => parseYaml(r.toString()));
}

export function parseYaml<T>(yamlText: string): T {
    return yaml.parse(yamlText);
}
