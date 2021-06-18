import type {FuzzyKeysOptions} from "./fuzzySortTypes";

export type DBIdentifier = number;
export type DBName = string;
export type DBFilename = string;
export type SearchPreppedKey = string;
export type DBSearchRanking = number;
export type EntryFieldNameToPreppedNameMapping = Map<string, SearchPreppedKey>;

export interface LangDB {
    name: DBName,
    upstreamCSV: DBFilename,
    localCSV: DBFilename,
    localLunr: DBFilename,
    shortNameToPreppedNameMapping: EntryFieldNameToPreppedNameMapping,
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
