type FuzzyResUnion = FuzzyKeyResult | string;
export interface FuzzyPreparedDBEntry {
    id: string,
    [s: string]: FuzzyResUnion,
}

export interface FuzzyPrepared {
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
    readonly score: number,
    readonly obj: FuzzyPreparedDBEntry,
}

// This odd name comes from upstream.
export interface FuzzyKeyResults extends ReadonlyArray<FuzzyKeyResult | null> {
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
