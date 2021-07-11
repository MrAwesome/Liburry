import fuzzysort from "fuzzysort";
import type {DBName, SearchResultEntryData, DBFullName, DisplayReadyField, DBRow} from "./types/dbTypes";

import type {FuzzyKeyResult, FuzzyKeyResults, FuzzyPreparedDBEntry} from "./types/fuzzySortTypes";

import {SearcherType} from "./search";

// TODO: remove when there are other types of search
import {DISPLAY_RESULTS_LIMIT} from "./searchSettings";
import {DBSearchRanking} from "./search";
import {PREPPED_KEY_SUFFIX} from "./search/FuzzySortSearcher";

// TODO: find out why "      " matches "chúi-pho 波紋 水波" on the "l" in "ripples"


export function parseFuzzySortResultsForRender(
    dbName: DBName,
    dbFullName: DBFullName,
    rawResults: FuzzyKeyResults[]
): SearchResultEntryData[] {
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((res) => fuzzySortResultToSearchResultEntry(dbName, dbFullName, res));
    return currentResultsElements;
}

// TODO: Unit test!
function fuzzySortResultToSearchResultEntry(dbName: DBName, dbFullName: DBFullName, fuzzysortResult: FuzzyKeyResults) {
    const obj = fuzzysortResult.obj;
    const rowID = obj.id;

    let fields = Object.getOwnPropertyNames(obj)
        .filter((key) => key.endsWith(PREPPED_KEY_SUFFIX))
        .map((key) => {
            const colName = key.replace(PREPPED_KEY_SUFFIX, '');
            const value = obj[colName] as string;

            // If the field was empty, fuzzysort doesn't generate the result object
            const fuzzyRes = obj[key] as FuzzyKeyResult | undefined;

            // NOTE: each matched field has its own score,
            //       which could be used to more strongly highlight the matched field
            let matched = false;
            if (fuzzyRes !== undefined) {
                if (fuzzyRes.score !== null) {
                    matched = true;
                }
            }

            let displayValOverride = null;
            if (matched) {
                displayValOverride = fuzzysort.highlight(fuzzyRes, "<mark>", "</mark>");
            }
            return {
                colName,
                value,
                matched,
                displayValOverride,
            } as DisplayReadyField;
        })

    const dbSearchRanking = {
        searcherType: SearcherType.FUZZYSORT,
        score: fuzzysortResult.score
    } as DBSearchRanking;

    return {
        key: dbName + "-" + rowID,
        dbID: parseInt(rowID),
        dbName,
        dbFullName,
        dbSearchRanking,
        fields,
    } as SearchResultEntryData;
}

// Prepare a fast search version of each searchable key.
// NOTE: this modifies the object and returns it as a type
//       which is a superset of its original type.
export function convertDBRowToFuzzySortPrepared(
    unpreparedEntry: DBRow,
    searchableKeys: (keyof DBRow)[],
): FuzzyPreparedDBEntry {
    searchableKeys.forEach(
        (key) => {
            unpreparedEntry[key + PREPPED_KEY_SUFFIX] = fuzzysort
                    // @ts-ignore  prepareSlow does exist
                    .prepareSlow
                    (unpreparedEntry[key]);
        });

    return unpreparedEntry as FuzzyPreparedDBEntry;
}
