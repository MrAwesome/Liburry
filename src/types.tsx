import type {FuzzyKeysOptions} from "./fuzzySortTypes";

export enum MainDisplayAreaMode {
    HOME,
    SEARCH,
    ABOUT,
    CONTACT,
    SETTINGS,
}

export type DBIdentifier = number;
export type DBName = string;
export type DBFilename = string;
export type JSONDBKey = string;
export type SearchPreppedKey = string;
export type DBSearchRanking = number;
export type ShortNameToPreppedNameMapping = Map<JSONDBKey, SearchPreppedKey>;

export interface LangDB {
    dbFilename: DBFilename,
    shortNameToPreppedNameMapping: ShortNameToPreppedNameMapping,
    searchKeys: Array<SearchPreppedKey>,
    fuzzyOpts: FuzzyKeysOptions,
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

export interface PerDictResults {
    dbName: DBName,
    results: Array<SearchResultEntry>,
    // TODO: store the intermediate results for each search as well?
}

// TODO: add type of search which produced this
export interface SearchResultEntry {
    key: string;
    dbID: DBIdentifier;
    dbName: DBName;
    dbSearchRanking: DBSearchRanking;
    pojUnicodeText: string;
    pojUnicode: string;
    pojInput: string;
    hoabun: string;
    pojNormalized: string;
    definition: string;
}
