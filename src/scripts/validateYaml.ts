import {LoadedConfig} from "../configHandler/zodConfigTypes";
import {YAML_FILENAME_TO_SCHEMA_MAPPING} from "./compileYaml";
// TODO:
// 1) Warn on unused languages
// 2) Error on defined languages with missing fields

export default function validateYaml(filename: string, yamlBlob: Object): LoadedConfig | null {
    if (filename in YAML_FILENAME_TO_SCHEMA_MAPPING) {
        const m = YAML_FILENAME_TO_SCHEMA_MAPPING[filename as keyof typeof YAML_FILENAME_TO_SCHEMA_MAPPING];
        return {
            type: "config",
            configType: m.type,
            config: m.schema.parse(yamlBlob),
        } as LoadedConfig;
    } else {
        return null;
    }
}
