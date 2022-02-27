import fuzzysort from "fuzzysort";

import {FuzzyPreparedDBEntry} from "../../types/fuzzySortTypes";
import {OngoingSearch, Searcher, SearcherPreparer, SearcherType, SearchFailure} from "../../search/searchers/Searcher";
import {RawDBRow, SingleDBLoadStatus} from "../../types/dbTypes";
import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import {getEntriesFromPreparedCSV} from "../../common/csvUtils";
import {makeCancelable} from "../../utils";
import {convertDBRowToFuzzySortPrepared, parseFuzzySortResultsForRender} from "../../fuzzySortUtils";
import {SEARCH_RESULTS_LIMIT} from "../../search/searchers/constants";
import {WriteableType} from "../../types/typeUtils";
import DBConfig from "../../configHandler/DBConfig";

// TODO: give slight preference for poj-unicode/poj-normalized in fuzzy settings, so that e.g. "iong" will show up first in a search for itself
// TODO: handle hyphens vs spaces

export const FUZZY_SCORE_LOWER_THRESHOLD = -1000;
export const PREPPED_KEY_SUFFIX = "_zzprepped"

function getFuzzyOpts(searchKeys: Array<string>): Fuzzysort.KeysOptions<FuzzyPreparedDBEntry> {
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

    search(query: string): OngoingSearch | SearchFailure {
        return this.fuzzyDict.search(query);
    }

}

export class FuzzySortPreparer implements SearcherPreparer {
    console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private sendLoadStateUpdate: (stateDelta: Partial<SingleDBLoadStatus>) => void,
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

        return fetch(localCSV)
            .then((response: Response) => {
                this.sendLoadStateUpdate({isDownloaded: true});
                return response.text();
            })
            .then((text: string) => {
                this.sendLoadStateUpdate({isParsed: true});
                return this.convertCSVToFuzzySearchableDict(text);
            });
    }

    convertCSVToFuzzySearchableDict(text: string): FuzzySearchableDict {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        const searchableFields = this.dbConfig.getSearchableFields();
        this.console.timeEnd("fetch-" + dbIdentifier);

        this.console.time("csvConvertPrePrepped-" + dbIdentifier);
        const nonFuzzyPreppedEntries: RawDBRow[] = getEntriesFromPreparedCSV(text);
        this.console.timeEnd("csvConvertPrePrepped-" + dbIdentifier);

        this.console.time("prepareSlow-" + dbIdentifier);
        const searchableEntries = nonFuzzyPreppedEntries.map(
            (d) => convertDBRowToFuzzySortPrepared(d, searchableFields));
        this.console.timeEnd("prepareSlow-" + dbIdentifier);
        this.console.timeEnd("total-" + dbIdentifier);

        const primaryKey = this.dbConfig.getPrimaryKey();

        return new FuzzySearchableDict(this.dbConfig, searchableEntries, this.debug, primaryKey);
    }

}

class FuzzySearchableDict {
    console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private searchableEntries: Array<FuzzyPreparedDBEntry>,
        private debug: boolean,
        private primaryKey: string,
    ) {
        this.console = getDebugConsole(debug);
        this.search = this.search.bind(this);
    }

    search(
        query: string,
    ): OngoingSearch | SearchFailure {
        const dbIdentifier = this.dbConfig.getDBIdentifier();

        const fuzzyOpts = getFuzzyOpts(this.dbConfig.getSearchableFields());
        const cancelableSearchPromise = fuzzysort.goAsync(
            query,
            this.searchableEntries,
            fuzzyOpts, // TODO: get from langdb
        );

        const cancelableParsePromise = makeCancelable(cancelableSearchPromise.then(
            (rawResults) => {
                // Filter out duplicates, as fuzzysort occasionally gives them to us and React loathes duplicate keys
                // TODO: Find out why this doesn't prevent the flash of warning text from react
                const res = filterDupes(rawResults, this.primaryKey);

                ongoingSearch.markCompleted();
                const results = parseFuzzySortResultsForRender(
                    dbIdentifier,
                    this.primaryKey,
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

function filterDupes(rawResults: Fuzzysort.KeysResults<FuzzyPreparedDBEntry>, primaryKey: string): Fuzzysort.KeysResults<FuzzyPreparedDBEntry> {
    const seen = new Set();
    const filtered: Partial<WriteableType<Fuzzysort.KeysResults<FuzzyPreparedDBEntry>>> = rawResults.filter(({obj}) => {
        if (seen.has(obj[primaryKey])) {
            return false;
        }
        seen.add(obj[primaryKey]);
        return true;
    });
    filtered.total = rawResults.total;
    return filtered as Fuzzysort.KeysResults<FuzzyPreparedDBEntry>;
}
