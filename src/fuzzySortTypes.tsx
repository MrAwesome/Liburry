import {DBName} from "./types";

export interface FuzzySearchableDict {
    dbName: DBName,
    searchableEntries: Array<FuzzyPreparedSearchableEntry>,
}

export interface FuzzyPreparedSearchableEntry extends Object {
    readonly e: string,
    engPrepped: FuzzyPrepared,
    readonly p: string,
    pojPrepped: FuzzyPrepared,
    readonly n: string,
    pojNormalizedPrepped: FuzzyPrepared,
    readonly h: string,
    hoaPrepped: FuzzyPrepared,

    readonly i: string,
    inputCharsPrepped: FuzzyPrepared,

    readonly d: number,

    // Ideal:
    //    readonly [POJ_UNICODE_SHORTNAME: string]: string,
    //    [POJ_UNICODE_PREPPED_KEY as string]: Prepared,
}

interface FuzzyPrepared {
    // Original target string
    readonly target: string
}

// fuzzysort does not export types, so we have to recreate them {{{
interface FuzzyResult {
    readonly score: number,
    readonly target: string,
    readonly indexes: number[],
}

export interface FuzzyKeyResult extends FuzzyResult {
    readonly obj: FuzzyPreparedSearchableEntry,
}

export interface FuzzyKeyResults extends ReadonlyArray<FuzzyKeyResult> {
    readonly score: number
    readonly obj: FuzzyPreparedSearchableEntry
}

interface FuzzyOptions {
    threshold?: number
    limit?: number
    allowTypo?: boolean
}

export interface FuzzyKeysOptions extends FuzzyOptions {
    keys: ReadonlyArray<string | ReadonlyArray<string>>
    //scoreFn?: (keysResult:ReadonlyArray<KeyResult<T>>) => number
}

export interface CancelablePromise<T> extends Promise<T> {
    cancel(): void
}
// }}}
