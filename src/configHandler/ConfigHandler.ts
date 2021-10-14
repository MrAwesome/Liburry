import {RawAllDBConfig, RawAppConfig, RawLangConfig} from "./zodConfigTypes";
import {loadYaml} from "../utils/yaml";

const CONFIG_FILENAME_LANG = "lang";
const CONFIG_FILENAME_APP = "app";
const CONFIG_FILENAME_DB = "db";

// TODO: determine how to force strong typing at load time
// TODO: determine how to handle versioning configs and versions here
export default class ConfigHandler {
    constructor(
        private appName: string,
        private localMode: boolean = false,
    ) {}

    async loadLanguageConfigs(): Promise<RawLangConfig> {
        return this.loadConfigHeirarchy(CONFIG_FILENAME_LANG);
    }

    async loadAppConfig(): Promise<RawAppConfig> {
        return this.loadAppSpecificConfig(CONFIG_FILENAME_APP);
    }

    async loadDBConfigs(): Promise<RawAllDBConfig> {
        return this.loadAppSpecificConfig(CONFIG_FILENAME_DB);
    }

    private async loadAppSpecificConfig<T>(configName: string): Promise<T> {
        return loadYaml<T>(`config/${this.appName}/${configName}.yml`, this.localMode);
    }

    private async loadConfigHeirarchy<T>(configName: string): Promise<T> {
        // TODO: handle empty/null lang config!
        // TODO: load default / merge app? or just default?
        return Promise.all([
            loadYaml<T>(`config/default/${configName}.yml`, this.localMode),
            //loadYaml<T>(`config/${this.appName}/${configName}.yml`, this.localMode),
        ]).then(([globalConfig, localConfig]) => {
            return {...globalConfig, ...localConfig};
        });
    }
    // TODO: consider having multiple files for language, since it can get rather large?
}
