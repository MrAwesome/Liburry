import fuzzysort from "fuzzysort";
import {DBName, PerDictResults, SearchResultEntry, LangDB, RawJSONEntry, ShortNameToPreppedNameMapping} from "./types";

import {FuzzyKeyResult, FuzzyKeyResults, FuzzyPreparedSearchableEntry, FuzzySearchableDict} from "./fuzzySortTypes";

// TODO: remove when there are other types of search
import {DATABASES, DEFAULT_DEFINITION_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_INPUT_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./search_options";
import {SearchFailure, OngoingSearch} from "./search";
import {getWorkerDebugConsole} from "./debug_console";

export async function fuzzySortFetchAndPrepare(
    dbName: string,
    langDB: LangDB,
    debug: boolean,
): Promise<FuzzySearchableDict> {
    const debugConsole = getWorkerDebugConsole(debug);
    const {dbFilename, shortNameToPreppedNameMapping} = langDB;
    debugConsole.time("fetch-" + dbName);
    return fetch(dbFilename)
        .then((response: Response) => {
            debugConsole.timeEnd("fetch-" + dbName);
            debugConsole.time("jsonConvert-" + dbName);
            return response.json();
        })
        .then((prePreparedData: RawJSONEntry[]) => {
            debugConsole.timeEnd("jsonConvert-" + dbName);
            debugConsole.time("prepareSlow-" + dbName);
            const data = prePreparedData.map((d) => convertRawJSONEntryToFuzzySortPrepared(shortNameToPreppedNameMapping, d));
            debugConsole.timeEnd("prepareSlow-" + dbName);

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
            const pojUnicodeText = obj.p;
            const rowID = obj.d;

            // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
            //       console.log(fuzzysortResult)
            //
            // TODO: per-db indexing
            const pojNormalizedPossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_NORMALIZED_INDEX];
            const pojInputPossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_INPUT_INDEX];
            const definitionPossiblePreHLMatch = fuzzysortResult[DEFAULT_DEFINITION_INDEX];
            const pojUnicodePossiblePreHLMatch = fuzzysortResult[DEFAULT_POJ_UNICODE_INDEX];
            const hoabunPossiblePreHLMatch = fuzzysortResult[DEFAULT_HOABUN_INDEX];

            const pojNormalized = fuzzySortHighlight(pojNormalizedPossiblePreHLMatch, null);
            const pojInput = fuzzySortHighlight(pojInputPossiblePreHLMatch, null);
            const definition = fuzzySortHighlight(definitionPossiblePreHLMatch, obj.e);
            const pojUnicode = fuzzySortHighlight(pojUnicodePossiblePreHLMatch, pojUnicodeText);
            const hoabun = fuzzySortHighlight(hoabunPossiblePreHLMatch, obj.h);

            return {
                key: dbName + "-" + rowID,
                dbID: rowID,
                dbName,
                dbSearchRanking: fuzzysortResult.score,
                pojUnicodeText,
                pojUnicode,
                pojInput,
                hoabun,
                pojNormalized,
                definition,
            } as SearchResultEntry;
        })
    return currentResultsElements;
}

// Prepare a fast search version of each searchable key.
// NOTE: this modifies the object and returns it as a type
//       which is a superset of its original type.
function convertRawJSONEntryToFuzzySortPrepared(
    shortNameToPreppedNameMapping: ShortNameToPreppedNameMapping,
    rawJSONEntry: RawJSONEntry,
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

    return rawJSONEntry as FuzzyPreparedSearchableEntry;
}

function fuzzySortHighlight(
    possibleMatch: FuzzyKeyResult | null,
    defaultDisplay: string | null,
): string | null {
    // NOTE: fuzzysort.highlight actually accepts null, but its type signature is wrong
    if (possibleMatch === null) {return defaultDisplay;}
    return fuzzysort.highlight(possibleMatch, "<mark>", "</mark>") || defaultDisplay;
}

export function fuzzySortSearch(
    searchableDict: FuzzySearchableDict | null,
    query: string,
    debug: boolean,
): OngoingSearch | SearchFailure {
    const debugConsole = getWorkerDebugConsole(debug);
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

    const parsePromise = cancelableSearchPromise.then(
        rawResults => {
            // Filter out duplicates, as fuzzysort occasionally gives them to us and React loathes duplicate keys
            // TODO: Find out why this doesn't prevent the flash of warning text from react
            const seen = new Set();
            const res = rawResults.filter(({obj}) => {
                if (seen.has(obj.d)) {
                    return false;
                }
                seen.add(obj.d);
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
            return SearchFailure.FuzzyParsePromiseFailed;
        }
    );

    const ongoingSearch = new OngoingSearch(dbName, query, debug, cancelableSearchPromise, parsePromise);

    return ongoingSearch;
}
