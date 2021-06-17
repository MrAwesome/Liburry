import fuzzysort from "fuzzysort";
import type {DBName, PerDictResults, SearchResultEntry, LangDB, EntryFieldNameToPreppedNameMapping} from "./types/dbTypes";

import type {FuzzyKeyResult, FuzzyKeyResults, FuzzyPreparedDBEntry, FuzzySearchableDict} from "./types/fuzzySortTypes";

// TODO: remove when there are other types of search
import {DATABASES, DEFAULT_DEFINITION_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_INPUT_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./searchSettings";
import {SearchFailure, OngoingSearch} from "./search";
import getDebugConsole from "./getDebugConsole";
import {makeCancelable} from "./utils";
import {getEntriesFromPreparedCSV} from "./common/csvUtils";
import {DBEntry} from "./common/dbTypes";

// TODO: continue testing performance
export async function fuzzySortFetchPrePrepared(
    dbName: string,
    langDB: LangDB,
    debug: boolean,
): Promise<FuzzySearchableDict> {
    const debugConsole = getDebugConsole(debug);
    const {dbFilenameFuzzyPrepped} = langDB;
    debugConsole.time("total-" + dbName);
    debugConsole.time("fetch-" + dbName);
    return fetch(dbFilenameFuzzyPrepped)
        .then((response: Response) => {
            return response.text();
        })
        .then((text: string) => {
            debugConsole.timeEnd("fetch-" + dbName);
            debugConsole.time("jsonConvertPrePrepped-" + dbName);
            const searchableEntries: FuzzyPreparedDBEntry[] = JSON.parse(text);
            debugConsole.timeEnd("jsonConvertPrePrepped-" + dbName);
            debugConsole.timeEnd("total-" + dbName);

            return {
                dbName,
                searchableEntries,
            } as FuzzySearchableDict;
        });
}

export async function fuzzySortFetchAndPrepare(
    dbName: string,
    langDB: LangDB,
    debug: boolean,
): Promise<FuzzySearchableDict> {
    const debugConsole = getDebugConsole(debug);
    const {localCSV, shortNameToPreppedNameMapping} = langDB;
    debugConsole.time("total-" + dbName);
    debugConsole.time("fetch-" + dbName);
    return fetch(localCSV)
        .then((response: Response) => {
            return response.text();
        })
        .then((text: string) => {
            debugConsole.timeEnd("fetch-" + dbName);

            debugConsole.time("csvConvertPrePrepped-" + dbName);
            const searchableEntries: DBEntry[] = getEntriesFromPreparedCSV(text);
            debugConsole.timeEnd("csvConvertPrePrepped-" + dbName);

            debugConsole.time("prepareSlow-" + dbName);
            const data = searchableEntries.map((d) => convertDBEntryToFuzzySortPrepared(shortNameToPreppedNameMapping, d));
            debugConsole.timeEnd("prepareSlow-" + dbName);
            debugConsole.timeEnd("total-" + dbName);

            return {
                dbName,
                searchableEntries: data
            } as FuzzySearchableDict;
        });
}

export function parseFuzzySortResultsForRender(
    dbName: DBName,
    rawResults: FuzzyKeyResults[]
): SearchResultEntry[] {
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((fuzzysortResult: FuzzyKeyResults, _: number) => {
            const obj = fuzzysortResult.obj;
            const pojUnicodeText = obj.poj_unicode;
            const rowID = obj.id;

            // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
            //       console.log(fuzzysortResult)
            //
            // TODO: per-db indexing
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

            return {
                key: dbName + "-" + rowID,
                dbID: rowID,
                dbName,
                dbSearchRanking: fuzzysortResult.score,
                pojUnicodeText,
                pojUnicodePossibleMatch,
                pojInputPossibleMatch,
                hoabunPossibleMatch,
                pojNormalizedPossibleMatch,
                definitionPossibleMatch,
            } as SearchResultEntry;
        })
    return currentResultsElements;
}

// Prepare a fast search version of each searchable key.
// NOTE: this modifies the object and returns it as a type
//       which is a superset of its original type.
export function convertDBEntryToFuzzySortPrepared(
    shortNameToPreppedNameMapping: EntryFieldNameToPreppedNameMapping,
    rawJSONEntry: DBEntry,
) {
    shortNameToPreppedNameMapping.forEach(
        (preppedKey, shortName) => {
            // @ts-ignore  force dynamic index
            rawJSONEntry[preppedKey] =
                fuzzysort
                    // @ts-ignore  prepareSlow does exist
                    .prepareSlow
                    // @ts-ignore  force dynamic index
                    (rawJSONEntry[shortName]);
        });

    return rawJSONEntry as FuzzyPreparedDBEntry;
}

function fuzzySortHighlight<T>(
    possibleMatch: FuzzyKeyResult | null,
    defaultDisplay: string | T,
): string | T {
    // NOTE: fuzzysort.highlight actually accepts null, but its type signature is wrong
    if (possibleMatch === null) {return defaultDisplay;}
    return fuzzysort.highlight(possibleMatch, "<mark>", "</mark>") || defaultDisplay;
}

export function fuzzySortSearch(
    searchableDict: FuzzySearchableDict | null,
    query: string,
    debug: boolean,
): OngoingSearch | SearchFailure {
    const debugConsole = getDebugConsole(debug);
    if (searchableDict === null) {
        return SearchFailure.FuzzyNoSearchableDict;
    }

    const {dbName, searchableEntries} = searchableDict;
    const langDB = DATABASES.get(dbName);
    if (!langDB) {
        debugConsole.log("Failed to load langDB:", dbName, DATABASES);
        return SearchFailure.FuzzyFailedToLoadLangDB;
    }
    const {fuzzyOpts} = langDB;
    const cancelableSearchPromise = fuzzysort.goAsync(
        query,
        searchableEntries,
        fuzzyOpts, // TODO: get from langdb
    );

    const cancelableParsePromise = makeCancelable(cancelableSearchPromise.then(
        rawResults => {
            // Filter out duplicates, as fuzzysort occasionally gives them to us and React loathes duplicate keys
            // TODO: Find out why this doesn't prevent the flash of warning text from react
            const seen = new Set();
            const res = rawResults.filter(({obj}) => {
                if (seen.has(obj.id)) {
                    return false;
                }
                seen.add(obj.id);
                return true;
            });

            ongoingSearch.markCompleted();
            const results = parseFuzzySortResultsForRender(
                dbName,
                // @ts-ignore Deal with lack of fuzzysort interfaces
                res,
            );
            return {
                dbName,
                results
            } as PerDictResults;
        }
    ).catch(
        (reason) => {
            debugConsole.log(searchableDict.dbName, reason);
            return SearchFailure.ParsePromiseFailed;
        }
    ));

    const ongoingSearch = new OngoingSearch(dbName, query, debug, cancelableSearchPromise, cancelableParsePromise);

    return ongoingSearch;
}
