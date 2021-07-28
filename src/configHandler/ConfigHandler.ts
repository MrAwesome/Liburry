import fs from 'fs';
import yaml from "yaml";
import {AppName} from "../ChhaTaigiOptions";
import {promisify} from 'util';
import {AllDBConfig, AppConfig, LanguageConfig} from '../types/config';

const PUBLIC_PREFIX = "public/";

const CONFIG_FILENAME_LANG = "lang";
const CONFIG_FILENAME_APP = "app";
const CONFIG_FILENAME_DB = "db";

// TODO: determine how to force strong typing at load time
export default class ConfigHandler {
    constructor(
        private appName: AppName,
        private localMode: boolean = false,
    ) {}

    async loadLanguageConfigs(): Promise<LanguageConfig> {
        return this.loadConfigHeirarchy(CONFIG_FILENAME_LANG);
    }

    async loadAppConfig(): Promise<AppConfig> {
        return this.loadAppSpecificConfig(CONFIG_FILENAME_APP);
    }

    async loadDBConfig(): Promise<AllDBConfig> {
        return this.loadAppSpecificConfig(CONFIG_FILENAME_DB);
    }

    private async loadAppSpecificConfig<T>(configName: string): Promise<T> {
        return loadYaml<T>(`config/${this.appName}/${configName}.yml`, this.localMode);
    }

    private async loadConfigHeirarchy<T>(configName: string): Promise<T> {
        // TODO: handle empty/null lang config!
        return Promise.all([
            loadYaml<T>(`config/${configName}.yml`, this.localMode),
            loadYaml<T>(`config/${this.appName}/${configName}.yml`, this.localMode),
        ]).then(([globalConfig, localConfig]) => {
            return {...globalConfig, ...localConfig};
        });
    }
    // TODO: consider having multiple files for language, since it can get rather large?
}

async function loadYaml<T>(url: string, localMode: boolean): Promise<T> {
    const textProm = loadYamlText(url, localMode);
    return textProm.then((yamlText) => parseYaml(yamlText));
}

function loadYamlText(url: string, localMode: boolean) {
    let prom: Promise<string>;
    if (localMode) {
        const readFile = promisify(fs.readFile);
        prom = readFile(PUBLIC_PREFIX + url, null).then((r) => r.toString());
    } else {
        prom = fetch(url).then((r) => r.text());
    }
    return prom;
}

function parseYaml<T>(yamlText: string): T {
    return yaml.parse(yamlText);
}
