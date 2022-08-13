import yaml from "yaml";

export function parseYaml<T>(yamlText: string): T {
    return yaml.parse(yamlText);
}
