import yaml from "yaml";

// NOTE: This needs some error-checking and handling? Right now, this will bail
//       with "All collection items must start at the same column" after being pointed
//       at a non-existent url
export async function loadYaml<T>(url: string, localMode: boolean): Promise<T> {
    const textProm = loadYamlText(url, localMode);
    return textProm.then((yamlText) => parseYaml(yamlText));
}

export async function loadYamlText(url: string, localMode: boolean): Promise<string> {
    const fs = await import('fs');
    const {promisify} = await import('util');

    let prom;
    if (localMode) {
        const readFile = promisify(fs.readFile);
        prom = readFile("public/" + url, null).then((r) => r.toString());
    } else {
        prom = fetch(url).then((r) => r.text());
    }
    return prom;
}

export async function loadTestYaml<T>(filename: string): Promise<T> {
    const fs = await import('fs');
    const {promisify} = await import('util');
    const readFile = promisify(fs.readFile);
    return readFile(filename, null).then((r) => parseYaml(r.toString()));
}

export function parseYaml<T>(yamlText: string): T {
    return yaml.parse(yamlText);
}
