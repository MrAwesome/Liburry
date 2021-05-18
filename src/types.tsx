import {OngoingSearch} from "./search";

export type DBName = string;
export type DBFilename = string;
export type JSONDBKey = string;
export type SearchPreppedKey = string;
export type DBSearchRanking = number;

export interface LangDB {
    dbFilename: DBFilename,
    shortNameToPreppedNameMapping: Map<JSONDBKey, SearchPreppedKey>,
    searchKeys: Array<SearchPreppedKey>,
    fuzzyOpts: KeysOptions,
}

export interface SearchableDict {
    dbName: DBName,
    searchableEntries: Array<PreparedSearchableEntry>,
}

export interface ChaTaigiState<E> {
    query: string,
    currentResults: Map<DBName, E>,
    ongoingSearches: Array<OngoingSearch<PerDictResults>>,
    loadedDBs: Map<DBName, boolean>,
}

export interface ChaTaigiStateArgs<E> {
    query?: string,
    currentResults?: Map<DBName, E>,
    ongoingSearches?: Array<OngoingSearch<PerDictResults>>,
    loadedDBs?: Map<DBName, boolean>,
}

interface Prepared {
    // Original target string
    readonly target: string
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

export interface PreparedSearchableEntry extends Object {
    readonly e: string,
    engPrepped: Prepared,
    readonly p: string,
    pojPrepped: Prepared,
    readonly n: string,
    pojNormalizedPrepped: Prepared,
    readonly h: string,
    hoaPrepped: Prepared,

    readonly i: string,
    inputCharsPrepped: Prepared,

    readonly d: number,

    // Ideal:
    //    readonly [POJ_UNICODE_SHORTNAME: string]: string,
    //    [POJ_UNICODE_PREPPED_KEY as string]: Prepared,
}

// fuzzysort does not export types, so we have to recreate them {{{
interface Result {
    readonly score: number,
    readonly target: string,
    readonly indexes: number[],
}

export interface KeyResult extends Result {
    readonly obj: PreparedSearchableEntry,
}

export interface KeyResults extends ReadonlyArray<KeyResult> {
    readonly score: number
    readonly obj: PreparedSearchableEntry
}

interface Options {
    threshold?: number
    limit?: number
    allowTypo?: boolean
}

export interface KeysOptions extends Options {
    keys: ReadonlyArray<string | ReadonlyArray<string>>
    //scoreFn?: (keysResult:ReadonlyArray<KeyResult<T>>) => number
}

export interface CancelablePromise<T> extends Promise<T> {
    cancel(): void
}
// }}}

// TODO: instead of this, tag all results with their relevant dict?
// TODO: sort all results by overall relevance somehow?
// TODO: combine overlapping results, etc
export interface PerDictResults {
    dbName: DBName,
    results: Array<SearchResultEntry>,
    // TODO: store the intermediate results for each search as well?
}

export interface SearchResultEntry {
    key: string;
    dbName: DBName;
    dbSearchRanking: DBSearchRanking;
    pojUnicodeText: string;
    pojUnicode: string;
    pojInput: string;
    hoabun: string;
    pojNormalized: string;
    definition: string;
}
