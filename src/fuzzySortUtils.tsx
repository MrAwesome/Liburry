import fuzzysort from "fuzzysort";
import {DBName, PerDictResults, SearchResultEntry} from "./types";
import {FuzzyKeyResult, FuzzyKeyResults, FuzzySearchableDict} from "./fuzzySortTypes";

// TODO: remove when there are other types of search
import {DATABASES, DEFAULT_DEFINITION_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_INPUT_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./search_options";
import {OngoingSearch} from "./search";
import {getWorkerDebugConsole} from "./debug_console";

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

            const pojNormalized = fuzzysortHighlight(pojNormalizedPossiblePreHLMatch, null);
            const pojInput = fuzzysortHighlight(pojInputPossiblePreHLMatch, null);
            const definition = fuzzysortHighlight(definitionPossiblePreHLMatch, obj.e);
            const pojUnicode = fuzzysortHighlight(pojUnicodePossiblePreHLMatch, pojUnicodeText);
            const hoabun = fuzzysortHighlight(hoabunPossiblePreHLMatch, obj.h);

            // TODO: strongly type
            return {
                key: dbName + "-" + rowID,
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


function fuzzysortHighlight(
    possibleMatch: FuzzyKeyResult | null,
    defaultDisplay: string | null,
): string | null {
    // NOTE: fuzzysort.highlight actually accepts null, but its type signature is wrong
    if (possibleMatch === null) {return defaultDisplay;}
    return fuzzysort.highlight(possibleMatch, "<mark>", "</mark>") || defaultDisplay;
}

// TODO: make generic and allow for multiple search types
export function fuzzysortSearch(
    searchableDict: FuzzySearchableDict | null,
    query: string,
    debug: boolean,
): OngoingSearch | null {
    const debugConsole = getWorkerDebugConsole(debug);
    // TODO: re-trigger currently-ongoing search once db loads?
    if (searchableDict === null) {
        return null;
    }

    const {dbName, searchableEntries} = searchableDict;
    const langDB = DATABASES.get(dbName);
    if (!langDB) {
        debugConsole.log("Failed to load langDB:", dbName, DATABASES);
        return null;
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
            return null;
        }
    );

    const ongoingSearch = new OngoingSearch(dbName, query, debug, cancelableSearchPromise, parsePromise);

    return ongoingSearch;
}
