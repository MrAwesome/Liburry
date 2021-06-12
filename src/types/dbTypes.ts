import type {FuzzyKeysOptions} from "./fuzzySortTypes";

export type DBIdentifier = number;
export type DBName = string;
export type DBFilename = string;
export type JSONDBKey = string;
export type SearchPreppedKey = string;
export type DBSearchRanking = number;
export type ShortNameToPreppedNameMapping = Map<JSONDBKey, SearchPreppedKey>;

export interface LangDB {
    dbFilename: DBFilename,
    dbFilenameFuzzyPrepped: DBFilename,
    dbCSV: DBFilename,
    shortNameToPreppedNameMapping: ShortNameToPreppedNameMapping,
    searchKeys: Array<SearchPreppedKey>,
    fuzzyOpts: FuzzyKeysOptions,
    //fields: Array<LangField>,
}

export interface LangField {
    name: string,
    lang: Langs,
    area: string, // perhaps style directly instead?
    priority: number,
}

export enum Langs {
    POJ,
    KIP,
    ENGLISH,
    MANDO,
    POJ_TYPING_INPUT,
    POJ_NORMALIZED
}

// NOTE: The keys for searchable text are so small to reduce the
//       JSON file size (full length keys add >2MB to the filesize)
export interface RawJSONEntry extends Object {
    readonly e: string, // Definition
    readonly p: string, // POJ Unicode
    readonly n: string, // Normalized POJ
    readonly h: string, // Chinese Characters
    readonly i: string, // POJ Alphanumeric Input (chaa5, hak8-seng, etc)
    readonly d: number, // Numeric ID
}

// NOTE: This type is passed back from web workers.
export interface PerDictResults {
    dbName: DBName,
    results: Array<SearchResultEntry>,
}

// NOTE: This type is passed back from web workers.
// TODO: add type of search which produced this?
export interface SearchResultEntry {
    key: string;
    dbID: DBIdentifier;
    dbName: DBName;
    dbSearchRanking: DBSearchRanking;
    pojUnicodeText: string;
    pojUnicodePossibleMatch: string;
    pojInputPossibleMatch: string | null;
    hoabunPossibleMatch: string;
    pojNormalizedPossibleMatch: string | null;
    definitionPossibleMatch: string;
}
