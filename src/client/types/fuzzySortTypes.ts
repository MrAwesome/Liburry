type FuzzyResUnion = Fuzzysort.KeyResult<FuzzyPreparedDBEntry> | string;
export interface FuzzyPreparedDBEntry {
    [s: string]: FuzzyResUnion,
}
