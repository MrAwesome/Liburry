import {OngoingSearch} from "./search";

export type DBName = string;
export type DBFilename = string;
export type JSONDBKey = string;
export type SearchPreppedKey = string;

export interface LangDB {
    dbFilename: DBFilename,
    indexedKeys: Map<JSONDBKey, SearchPreppedKey>,
    searchKeys: Array<SearchPreppedKey>,
    fuzzyOpts: KeysOptions,
}

export interface SearchableDict {
    dbName: DBName,
    searchableEntries: Array<SearchableEntry>,
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
    searchableDicts?: Array<Array<SearchableEntry>>,
    ongoingSearches?: Array<OngoingSearch>,
}

interface Prepared {
    // Original target string
    readonly target: string
}

// NOTE: The keys for searchable text are so small to reduce the
//       JSON file size (full length keys add >2MB to the filesize)
export interface PrePreparedEntry extends Object {
    readonly e: string,
    readonly p: string,
    readonly n: string,
    readonly h: string,
}

export interface SearchableEntry extends Object {
    readonly e: string,
    eng_prepped: Prepared,
    readonly p: string,
    poj_prepped: Prepared,
    readonly n: string,
    poj_normalized_prepped: Prepared,
    readonly h: string,
    hoa_prepped: Prepared,
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

interface KeyResult extends Result {
    readonly obj: SearchableEntry,
}

export interface KeyResults extends ReadonlyArray<KeyResult> {
    readonly score: number
    readonly obj: SearchableEntry
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
