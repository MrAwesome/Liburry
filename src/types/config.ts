import {KnownDisplayTypeEntry} from "./displayTypes";
import {Language} from "./language";

export interface AppConfig {
    name: string,
    displayName: string,
    interfaceLangs: string[],
}

export interface AllDBConfig {
    [dbName: string]: DBConfig,
}

export type DBLoadInfo = {
    format: "local_csv",
    filename: string,
} | {
    format: "local_lunr",
    filename: string,
}

type FieldName = string;

export interface DBConfig {
    fullIdentifier: string,
    displayShortName: string,
    loadInfo: DBLoadInfo,

    // TODO: dynamically determine these by checking isTitleType (for now just "vocab") on all fields then getting the lang of those fields
    //titleLangs: Language[],
    //dataLangs: Language[],

    fields: FieldConfig,

    otherMetadata?: {
        [s: string]: any,
    }
}

// XXX TODO: try to use a csv-to-yaml converter to populate the field configs
export interface FieldConfig {
    name: FieldName,
    // XXX TODO: see if this mapping works
    fieldType: KnownDisplayTypeEntry | KnownDisplayTypeEntry[],
    delimiter?: string,

    // NOTE: The array is so that fields containing multiple languages can be appropriately tagged
    language: Language | Language[],
}

