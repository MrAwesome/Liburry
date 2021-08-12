import {AppName} from "../ChhaTaigiOptions";
import {AllDBConfig, AppConfig, LanguageConfig} from '../types/config';
import {loadYaml} from "../utils/yaml";

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
