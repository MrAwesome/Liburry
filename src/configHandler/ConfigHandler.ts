import {CONFIG_TARGET_JSON_FILENAME} from "../constants";
import {ReturnedFinalConfig, returnedFinalConfigSchema} from "./zodConfigTypes";

export default class ConfigHandler {
    // NOTE: this can load an app-specific config, if that's desired instead
    async genLoadFinalConfig(): Promise<ReturnedFinalConfig> {
        return fetch(CONFIG_TARGET_JSON_FILENAME)
            .then((text) => text.json())
            .then((blob) => returnedFinalConfigSchema.parseAsync(blob));
    }
}
