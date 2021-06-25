import fuzzysort from "fuzzysort";
import type {DBName, SearchResultEntry, EntryFieldNameToPreppedNameMapping} from "./types/dbTypes";

import type {FuzzyKeyResult, FuzzyKeyResults, FuzzyPreparedDBEntry} from "./types/fuzzySortTypes";

import {SearcherType} from "./search";

// TODO: remove when there are other types of search
import {DEFAULT_DEFINITION_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_INPUT_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./searchSettings";
import {DBEntry} from "./common/dbTypes";
import {DBSearchRanking} from "./search";

export function parseFuzzySortResultsForRender(
    dbName: DBName,
    rawResults: FuzzyKeyResults[]
): SearchResultEntry[] {
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((res) => fuzzySortResultToSearchResultEntry(dbName, res));
    return currentResultsElements;
}

function fuzzySortResultToSearchResultEntry(dbName: DBName, fuzzysortResult: FuzzyKeyResults) {
    const obj = fuzzysortResult.obj;
    const pojUnicodeText = obj.poj_unicode;
    const rowID = obj.id;

    // TODO: per-db indexing
    // NOTE: This odd indexing is necessary because of how fuzzysort returns results.
    const pojNormalizedPossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_NORMALIZED_INDEX];
    const pojInputPossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_INPUT_INDEX];
    const definitionPossiblePreHLMatch = fuzzysortResult[DEFAULT_DEFINITION_INDEX];
    const pojUnicodePossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_UNICODE_INDEX];
    const hoabunPossiblePreHLMatch = fuzzysortResult[DEFAULT_HOABUN_INDEX];

    const pojNormalizedPossibleMatch = fuzzySortHighlight(pojNormalizedPossiblePreHLMatch, null);
    const pojInputPossibleMatch = fuzzySortHighlight(pojInputPossiblePreHLMatch, null);
    const definitionPossibleMatch = fuzzySortHighlight(definitionPossiblePreHLMatch, obj.english);
    const pojUnicodePossibleMatch = fuzzySortHighlight(pojUnicodePossiblePreHLMatch, pojUnicodeText);
    const hoabunPossibleMatch = fuzzySortHighlight(hoabunPossiblePreHLMatch, obj.hoabun);

    const dbSearchRanking = {
        searcherType: SearcherType.FUZZYSORT,
        score: fuzzysortResult.score
    } as DBSearchRanking;

    return {
        key: dbName + "-" + rowID,
        dbID: rowID,
        dbName,
        dbSearchRanking,
        pojUnicodeText,
        pojUnicodePossibleMatch,
        pojInputPossibleMatch,
        hoabunPossibleMatch,
        pojNormalizedPossibleMatch,
        definitionPossibleMatch,
    } as SearchResultEntry;
}

// Prepare a fast search version of each searchable key.
// NOTE: this modifies the object and returns it as a type
//       which is a superset of its original type.
export function convertDBEntryToFuzzySortPrepared(
    shortNameToPreppedNameMapping: EntryFieldNameToPreppedNameMapping,
    dbEntry: DBEntry,
): FuzzyPreparedDBEntry {
    shortNameToPreppedNameMapping.forEach(
        (preppedKey, shortName) => {
            // @ts-ignore  force dynamic index
            dbEntry[preppedKey] =
                fuzzysort
                    // @ts-ignore  prepareSlow does exist
                    .prepareSlow
                    // @ts-ignore  force dynamic index
                    (dbEntry[shortName]);
        });

    return dbEntry as FuzzyPreparedDBEntry;
}

function fuzzySortHighlight<T>(
    possibleMatch: FuzzyKeyResult | null,
    defaultDisplay: string | T,
): string | T {
    // NOTE: fuzzysort.highlight actually accepts null, but its type signature is wrong
    if (possibleMatch === null) {return defaultDisplay;}
    return fuzzysort.highlight(possibleMatch, "<mark>", "</mark>") || defaultDisplay;
}
