import fuzzysort from "fuzzysort";
import type {SearchResultEntryRaw, DisplayReadyFieldRaw, RawDBRow, DBSearchRanking} from "./types/dbTypes";

import type {FuzzyPreparedDBEntry} from "./types/fuzzySortTypes";

import {SearcherType} from "./search/searchers/Searcher";

import {DISPLAY_RESULTS_LIMIT} from "./search/searchers/constants";
import {PREPPED_KEY_SUFFIX} from "./search/searchers/FuzzySortSearcher";
import {DBIdentifier} from "./configHandler/zodConfigTypes";

import xss from "xss";
import {MATCH_END, MATCH_START} from "./search/searchers/constants";

// TODO: find out why "      " matches "chúi-pho 波紋 水波" on the "l" in "ripples"

export function parseFuzzySortResultsForRender(
    dbIdentifier: DBIdentifier,
    primaryKey: string,
    rawResults: Fuzzysort.KeysResults<FuzzyPreparedDBEntry>,
): SearchResultEntryRaw[] {
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((res) => fuzzySortResultToSearchResultEntry(dbIdentifier, primaryKey, res));
    return currentResultsElements;
}

// TODO: Unit test!
function fuzzySortResultToSearchResultEntry(
    dbIdentifier: DBIdentifier,
    primaryKey: string,
    fuzzysortResult: Fuzzysort.KeysResult<FuzzyPreparedDBEntry>,
): SearchResultEntryRaw {
    const obj = fuzzysortResult.obj;
    const rowID = obj[primaryKey] as string;

    const dbSearchRanking: DBSearchRanking = {
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

function handleFuzzyPreppedKey(obj: FuzzyPreparedDBEntry, key: string): DisplayReadyFieldRaw {
    const colName = key.replace(PREPPED_KEY_SUFFIX, '');
    const value = obj[colName] as string;

    // If the field was empty, fuzzysort doesn't generate the result object
    // (which is why we use obj[colName] directly instead of fuzzyRes.target)
    const fuzzyRes = obj[key] as Fuzzysort.KeyResult<FuzzyPreparedDBEntry> | undefined;

    // NOTE: each matched field has its own score,
    //       which could be used to more strongly highlight the matched field
    let matched = false;
    let displayValOverride: string | undefined;
    if (fuzzyRes !== undefined) {
        if (fuzzyRes.score !== null) {
            matched = true;
        }

        if (matched) {
            // NOTE: this leaves behind "artifact" matches on fuzzyRes, which lives around
            //       after the search is over. To fix this, clear the score and index fields.
            const highlighted = fuzzysort.highlight(fuzzyRes, MATCH_START, MATCH_END);
            if (highlighted !== null) {
                // DOMPurify doesn't work in web workers:
                //const clean = domPurify.sanitize(highlighted, {ALLOWED_TAGS: [MATCH_HTML_TAG]});

                // So we use xss instead:
                const clean = xss(highlighted);

                displayValOverride = clean;
            }

        }
    }

    return {
        colName,
        value,
        matched,
        displayValOverride,
    };
}

// Prepare a fast search version of each searchable key.
// NOTE: this modifies the object and returns it as a type
//       which is a superset of its original type.
export function convertDBRowToFuzzySortPrepared(
    unpreparedEntry: RawDBRow,
    searchableFields: (keyof RawDBRow)[],
): FuzzyPreparedDBEntry {
    searchableFields.forEach(
        (key) => {
            unpreparedEntry[key + PREPPED_KEY_SUFFIX] = fuzzysort
                // @ts-ignore  prepareSlow does exist
                .prepareSlow
                (unpreparedEntry[key]);
        });

    return unpreparedEntry as FuzzyPreparedDBEntry;
}
