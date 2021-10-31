import {CONFIG_TARGET_JSON_FILENAME} from "../constants";
import {nodeReadFileFromDir} from "../utils";
import {ReturnedFinalConfig, returnedFinalConfigSchema} from "./zodConfigTypes";

export default class ConfigHandler {
    constructor(
        private localMode = false,
    ) {}

    private async genLoadJSONText(): Promise<Object> {
        if (this.localMode) {
            return nodeReadFileFromDir("public/", CONFIG_TARGET_JSON_FILENAME).then((text) => JSON.parse(text));
        } else {
            return fetch(CONFIG_TARGET_JSON_FILENAME).then((text) => text.json())
        }
    }

    // NOTE: this can load an app-specific config, if that's desired instead
    async genLoadFinalConfig(): Promise<ReturnedFinalConfig> {
        return this.genLoadJSONText()
            // XXX TODO: note that this uses zod's parse method, which will throw if it encounters an error.
            //           this should use .spa, and give a sensible error to the user when we encounter a parsing error
            .then((blob) => returnedFinalConfigSchema.parseAsync(blob));
    }
}
