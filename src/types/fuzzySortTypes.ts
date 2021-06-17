import {DBEntry} from "../common/dbTypes";
import {DBName} from "./dbTypes";

export interface FuzzySearchableDict {
    dbName: DBName,
    searchableEntries: Array<FuzzyPreparedDBEntry>,
}

// TODO: why does this extend Object?
export interface FuzzyPreparedDBEntry extends DBEntry {
    engPrepped: FuzzyPrepared,
    pojPrepped: FuzzyPrepared,
    pojNormalizedPrepped: FuzzyPrepared,
    hoaPrepped: FuzzyPrepared,
    inputCharsPrepped: FuzzyPrepared,

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
    readonly obj: FuzzyPreparedDBEntry,
}

export interface FuzzyKeyResults extends ReadonlyArray<FuzzyKeyResult> {
    readonly score: number,
    readonly obj: FuzzyPreparedDBEntry,
}

interface FuzzyOptions {
    threshold?: number,
    limit?: number,
    allowTypo?: boolean,
}

export interface FuzzyKeysOptions extends FuzzyOptions {
    keys: ReadonlyArray<string | ReadonlyArray<string>>
    //scoreFn?: (keysResult:ReadonlyArray<KeyResult<T>>) => number
}
