import fuzzysort from "fuzzysort";

import {FuzzyKeysOptions, FuzzyPreparedDBEntry} from "../types/fuzzySortTypes";
import {OngoingSearch, Searcher, SearcherPreparer, SearcherType, SearchFailure} from "../search";
import {RawDBRow} from "../types/dbTypes";
import getDebugConsole, {StubConsole} from "../getDebugConsole";
import {getEntriesFromPreparedCSV} from "../common/csvUtils";
import {makeCancelable} from "../utils";
import {convertDBRowToFuzzySortPrepared, parseFuzzySortResultsForRender} from "../fuzzySortUtils";
import {FIELDS_TO_SEARCH, SEARCH_RESULTS_LIMIT} from "../searchSettings";
import {DBConfig} from "../types/config";

// TODO: give slight preference for poj-unicode/poj-normalized in fuzzy settings, so that e.g. "iong" will show up first in a search for itself
// TODO: handle hyphens vs spaces

export const FUZZY_SCORE_LOWER_THRESHOLD = -1000;
export const PREPPED_KEY_SUFFIX = "_zzprepped"

function getFuzzyOpts(searchKeys: Array<string> = FIELDS_TO_SEARCH): FuzzyKeysOptions {
    const keys = searchKeys.map((k) => k + PREPPED_KEY_SUFFIX);

    return {
        keys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: FUZZY_SCORE_LOWER_THRESHOLD,
    };
}

export class FuzzySortSearcher implements Searcher {
    searcherType = SearcherType.FUZZYSORT;

    constructor(
        private fuzzyDict: FuzzySearchableDict,
    ) {}

    async prepare(): Promise<void> {
    }

    search(query: string): OngoingSearch | SearchFailure {
        return this.fuzzyDict.search(query);
    }

}

export class FuzzySortPreparer implements SearcherPreparer {
    console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private debug: boolean,
    ) {
        this.console = getDebugConsole(debug);
        this.prepare = this.prepare.bind(this);
        this.fetchAndPrepare = this.fetchAndPrepare.bind(this);
        this.convertCSVToFuzzySearchableDict = this.convertCSVToFuzzySearchableDict.bind(this);
    }

    async prepare(): Promise<Searcher> {
        return this
            .fetchAndPrepare()
            .then((fuzzyDict) => {
                return new FuzzySortSearcher(fuzzyDict);
            });
    }

    async fetchAndPrepare(): Promise<FuzzySearchableDict> {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        const {localCSV} = this.dbConfig.getDBLoadInfo();
        if (localCSV === undefined) {
            const errMsg = `Fuzzy search requires a local CSV to be defined! (${dbIdentifier})`;
            throw new Error(errMsg);
        }
        this.console.time("total-" + dbIdentifier);
        this.console.time("fetch-" + dbIdentifier);
        //let versionString = "";
        // XXX TODO: fix csv versioning
        //if (localCSVVersion) {
        //    versionString = `?v=${localCSVVersion}`;
        //}
        return fetch("/" + localCSV)
            .then((response: Response) => {
                return response.text();
            })
            .then(this.convertCSVToFuzzySearchableDict);
    }

    convertCSVToFuzzySearchableDict(text: string): FuzzySearchableDict {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        const searchableFields = FIELDS_TO_SEARCH;
        this.console.timeEnd("fetch-" + dbIdentifier);

        this.console.time("csvConvertPrePrepped-" + dbIdentifier);
        const nonFuzzyPreppedEntries: RawDBRow[] = getEntriesFromPreparedCSV(text);
        this.console.timeEnd("csvConvertPrePrepped-" + dbIdentifier);

        this.console.time("prepareSlow-" + dbIdentifier);
        const searchableEntries = nonFuzzyPreppedEntries.map(
            (d) => convertDBRowToFuzzySortPrepared(d, searchableFields));
        this.console.timeEnd("prepareSlow-" + dbIdentifier);
        this.console.timeEnd("total-" + dbIdentifier);

        return new FuzzySearchableDict(this.dbConfig, searchableEntries, this.debug);
    }

}

class FuzzySearchableDict {
    console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private searchableEntries: Array<FuzzyPreparedDBEntry>,
        private debug: boolean
    ) {
        this.console = getDebugConsole(debug);
        this.search = this.search.bind(this);
    }

    search(
        query: string,
    ): OngoingSearch | SearchFailure {
        const dbIdentifier = this.dbConfig.getDBIdentifier();

        const fuzzyOpts = getFuzzyOpts();
        const cancelableSearchPromise = fuzzysort.goAsync(
            query,
            this.searchableEntries,
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
                    dbIdentifier,
                    // @ts-ignore Deal with lack of fuzzysort interfaces
                    res,
                );
                return {
                    dbIdentifier,
                    results
                };
            }
        ).catch(
            (reason) => {
                this.console.log(dbIdentifier, reason);
                return SearchFailure.ParsePromiseFailed;
            }
        ));

        const ongoingSearch = new OngoingSearch(dbIdentifier, query, this.debug, cancelableSearchPromise, cancelableParsePromise);

        return ongoingSearch;
    }

}
