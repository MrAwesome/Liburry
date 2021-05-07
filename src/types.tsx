import {OngoingSearch} from "./search";

export type DBName = string;
export type DBFilename = string;
export type JSONDBKey = string;
export type SearchPreppedKey = string;

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
    currentResultsElements: Array<E>,
    searchableDicts: Array<SearchableDict>,
    ongoingSearches: Array<OngoingSearch>,
}

export interface ChaTaigiStateArgs<E> {
    query?: string,
    currentResultsElements?: Array<E>,
    searchableDicts?: Array<Array<PreparedSearchableEntry>>,
    ongoingSearches?: Array<OngoingSearch>,
}

interface Prepared {
    // Original target string
    readonly target: string
}

// NOTE: The keys for searchable text are so small to reduce the
//       JSON file size (full length keys add >2MB to the filesize)
export interface RawJSONEntry extends Object {
    readonly e: string, // English
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

    //    readonly [POJ_UNICODE_SHORTNAME: string]: string,
    //    [POJ_UNICODE_PREPPED_KEY as string]: Prepared,
    //    readonly [POJ_NORMALIZED_SHORTNAME]: string,
    //    [POJ_NORMALIZED_PREPPED_KEY]: Prepared,
    //    readonly [ENGLISH_SHORTNAME]: string,
    //    [ENGLISH_PREPPED_KEY]: Prepared,
    //    readonly [HOABUN_SHORTNAME]: string,
    //    [HOABUN_PREPPED_KEY]: Prepared,
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
export interface PerDictResultsElements {
    dbName: DBName,
    results: Array<JSX.Element>,
    // TODO: store the intermediate results for each search as well?
}
