import fuzzysort from "fuzzysort";

import {FuzzyKeysOptions, FuzzyPreparedDBEntry} from "../types/fuzzySortTypes";
import {OngoingSearch, Searcher, SearcherType, SearchFailure} from "../search";
import {DBName, DBRow, LangDB, PerDictResultsRaw} from "../types/dbTypes";
import getDebugConsole, {StubConsole} from "../getDebugConsole";
import {getEntriesFromPreparedCSV} from "../common/csvUtils";
import {makeCancelable} from "../utils";
import {convertDBRowToFuzzySortPrepared, parseFuzzySortResultsForRender} from "../fuzzySortUtils";
import {FIELDS_TO_SEARCH, SEARCH_RESULTS_LIMIT} from "../searchSettings";

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


export default class FuzzySortSearcher implements Searcher {
    searcherType = SearcherType.FUZZYSORT;
    dbName: DBName;
    langDB: LangDB;
    debug: boolean;

    private fuzzyDict?: FuzzySearchableDict;

    constructor(dbName: DBName, langDB: LangDB, debug: boolean) {
        this.dbName = dbName;
        this.langDB = langDB;
        this.debug = debug;
    }

    async prepare(): Promise<void> {
        const preparer = new FuzzyPreparer(this.langDB, this.debug);
        return preparer
            .fetchAndPrepare()
            .then((fuzzyDict) => {
                this.fuzzyDict = fuzzyDict;
            });
    }

    search(query: string): OngoingSearch | SearchFailure {
        if (this.fuzzyDict === undefined) {
            console.warn("Tried to search before preparation: ", this);
            return SearchFailure.SearchedBeforePrepare;
        } else {
            return this.fuzzyDict.search(query);
        }
    }

}

class FuzzyPreparer {
    langDB: LangDB;
    console: StubConsole;
    debug: boolean;

    constructor(langDB: LangDB, debug: boolean) {
        this.langDB = langDB;
        this.debug = debug;
        this.console = getDebugConsole(debug);
        this.fetchAndPrepare = this.fetchAndPrepare.bind(this);
        this.convertCSVToFuzzySearchableDict = this.convertCSVToFuzzySearchableDict.bind(this);
    }

    async fetchAndPrepare(): Promise<FuzzySearchableDict> {
        const {name, localCSV, localCSVVersion} = this.langDB;
        const dbName = name;
        this.console.time("total-" + dbName);
        this.console.time("fetch-" + dbName);
        let versionString = "";
        if (localCSVVersion) {
            versionString = `?v=${localCSVVersion}`;
        }
        return fetch(localCSV + versionString)
            .then((response: Response) => {
                return response.text();
            })
            .then(this.convertCSVToFuzzySearchableDict);
    }

    convertCSVToFuzzySearchableDict(text: string): FuzzySearchableDict {
        const langDB = this.langDB;
        const searchableFields = FIELDS_TO_SEARCH;
        const dbName = langDB.name;
        this.console.timeEnd("fetch-" + dbName);

        this.console.time("csvConvertPrePrepped-" + dbName);
        const nonFuzzyPreppedEntries: DBRow[] = getEntriesFromPreparedCSV(text);
        this.console.timeEnd("csvConvertPrePrepped-" + dbName);

        this.console.time("prepareSlow-" + dbName);
        const searchableEntries = nonFuzzyPreppedEntries.map(
            (d) => convertDBRowToFuzzySortPrepared(d, searchableFields));
        this.console.timeEnd("prepareSlow-" + dbName);
        this.console.timeEnd("total-" + dbName);

        return new FuzzySearchableDict(langDB, searchableEntries, this.debug);
    }

}

class FuzzySearchableDict {
    langDB: LangDB;
    console: StubConsole;
    searchableEntries: Array<FuzzyPreparedDBEntry>;
    debug: boolean;

    constructor(langDB: LangDB, searchableEntries: Array<FuzzyPreparedDBEntry>, debug: boolean) {
        this.langDB = langDB;
        this.searchableEntries = searchableEntries;
        this.debug = debug;
        this.console = getDebugConsole(debug);
        this.search = this.search.bind(this);
    }

    search(
        query: string,
    ): OngoingSearch | SearchFailure {
        const langDB = this.langDB;
        const dbName = langDB.name;

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
                    dbName,
                    langDB.fullName,
                    // @ts-ignore Deal with lack of fuzzysort interfaces
                    res,
                );
                return {
                    dbName,
                    results
                } as PerDictResultsRaw;
            }
        ).catch(
            (reason) => {
                this.console.log(dbName, reason);
                return SearchFailure.ParsePromiseFailed;
            }
        ));

        const ongoingSearch = new OngoingSearch(dbName, query, this.debug, cancelableSearchPromise, cancelableParsePromise);

        return ongoingSearch;
    }

}
