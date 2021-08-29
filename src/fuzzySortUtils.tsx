import fuzzysort from "fuzzysort";
import type {SearchResultEntryRaw, DisplayReadyFieldRaw, RawDBRow} from "./types/dbTypes";

import type {FuzzyKeyResult, FuzzyKeyResults, FuzzyPreparedDBEntry} from "./types/fuzzySortTypes";

import {SearcherType} from "./search";

// TODO: remove when there are other types of search
import {DISPLAY_RESULTS_LIMIT} from "./searchSettings";
import {PREPPED_KEY_SUFFIX} from "./search/FuzzySortSearcher";
import {MATCH_HTML_TAG} from "./constants";
import {DBIdentifier} from "./types/config";

// TODO: find out why "      " matches "chúi-pho 波紋 水波" on the "l" in "ripples"


export function parseFuzzySortResultsForRender(
    dbIdentifier: DBIdentifier,
    rawResults: FuzzyKeyResults[]
): SearchResultEntryRaw[] {
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((res) => fuzzySortResultToSearchResultEntry(dbIdentifier, res));
    return currentResultsElements;
}

// TODO: Unit test!
function fuzzySortResultToSearchResultEntry(dbIdentifier: DBIdentifier, fuzzysortResult: FuzzyKeyResults) {
    const obj = fuzzysortResult.obj;
    const rowID = obj.id;

    const dbSearchRanking = {
        searcherType: SearcherType.FUZZYSORT,
        score: fuzzysortResult.score
    };

    const fields = getDisplayReadyFieldObjects(obj);

    return {
        key: dbIdentifier + "-" + rowID,
        rowID: parseInt(rowID),
        dbIdentifier,
        dbSearchRanking,
        fields,
    };
}

function getDisplayReadyFieldObjects(obj: FuzzyPreparedDBEntry): DisplayReadyFieldRaw[] {
    const knownKeys = Object.getOwnPropertyNames(obj);
    const fields = knownKeys.map((key) => {
        if (key.endsWith(PREPPED_KEY_SUFFIX)) {
            return handleFuzzyPreppedKey(obj, key);
        } else {
            // NOTE: this can be more efficient, although a DB is unlikely to have enough keys for it to matter, and this is only run on returned results.
            if (!knownKeys.includes(key + PREPPED_KEY_SUFFIX)) {
                return {
                    colName: key,
                    value: obj[key],
                    matched: false,
                } as DisplayReadyFieldRaw;
            } else {
                return undefined;
            }
        }
    });
    return fields.filter((f) => f !== undefined) as DisplayReadyFieldRaw[];
}

function handleFuzzyPreppedKey(obj: FuzzyPreparedDBEntry, key: string) {
    const colName = key.replace(PREPPED_KEY_SUFFIX, '');
    const value = obj[colName] as string;

    // If the field was empty, fuzzysort doesn't generate the result object
    // (which is why we use obj[colName] directly instead of fuzzyRes.target)
    const fuzzyRes = obj[key] as FuzzyKeyResult | undefined;

    // NOTE: each matched field has its own score,
    //       which could be used to more strongly highlight the matched field
    let matched = false;
    let displayValOverride = null;
    if (fuzzyRes !== undefined) {
        if (fuzzyRes.score !== null) {
            matched = true;
        }

        if (matched) {
            // NOTE: this leaves behind "artifact" matches on fuzzyRes, which lives around
            //       after the search is over. To fix this, clear the score and index fields.
            displayValOverride = fuzzysort.highlight(fuzzyRes, `<${MATCH_HTML_TAG}>`, `</${MATCH_HTML_TAG}>`);
        }
    }

    return {
        colName,
        value,
        matched,
        displayValOverride,
    } as DisplayReadyFieldRaw;
}

// Prepare a fast search version of each searchable key.
// NOTE: this modifies the object and returns it as a type
//       which is a superset of its original type.
export function convertDBRowToFuzzySortPrepared(
    unpreparedEntry: RawDBRow,
    searchableKeys: (keyof RawDBRow)[],
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
