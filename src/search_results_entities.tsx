import fuzzysort from "fuzzysort";
import {DBName, KeyResult, KeyResults, SearchResultEntry} from "./types";

// TODO: remove when there are other types of search
import {DEFAULT_ENGLISH_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_INPUT_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./search_options";

export function parseFuzzySortResultsForRender(
    dbName: DBName,
    rawResults: KeyResults[]
): SearchResultEntry[] {
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((fuzzysortResult: KeyResults, _: number) => {
            const obj = fuzzysortResult.obj;
            const pojUnicodeText = obj.p;
            const rowID = obj.d;

            // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
            //       console.log(fuzzysortResult)
            //
            // TODO: per-db indexing
            const pojNormalizedPossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_NORMALIZED_INDEX];
            const pojInputPossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_INPUT_INDEX];
            const englishPossiblePreHLMatch = fuzzysortResult[DEFAULT_ENGLISH_INDEX];
            const pojUnicodePossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_UNICODE_INDEX];
            const hoabunPossiblePreHLMatch = fuzzysortResult[DEFAULT_HOABUN_INDEX];

            const pojNormalized = fuzzysortHighlight(pojNormalizedPossiblePreHLMatch, null);
            const pojInput = fuzzysortHighlight(pojInputPossiblePreHLMatch, null);
            const english = fuzzysortHighlight(englishPossiblePreHLMatch, obj.e);
            const pojUnicode = fuzzysortHighlight(pojUnicodePossiblePreHLMatch, pojUnicodeText);
            const hoabun = fuzzysortHighlight(hoabunPossiblePreHLMatch, obj.h);

            // TODO: strongly type
            return {
                key: dbName + "-" + rowID,
                pojUnicodeText,
                pojUnicode,
                pojInput,
                hoabun,
                pojNormalized,
                english,
            } as SearchResultEntry;
        })
    return currentResultsElements;
}


function fuzzysortHighlight(
    possibleMatch: KeyResult | null,
    defaultDisplay: string | null,
): string | null {
    // NOTE: fuzzysort.highlight actually accepts null, but its type signature is wrong
    if (possibleMatch === null) {return defaultDisplay;}
    return fuzzysort.highlight(possibleMatch, "<mark>", "</mark>") || defaultDisplay;
}
