import type {DBShortName, DBRow, LangDB, PerDictResultsRaw} from "../types/dbTypes";

import {DISPLAY_RESULTS_LIMIT} from "../searchSettings";
import getDebugConsole, {StubConsole} from "../getDebugConsole";
import {DBSearchRanking, OngoingSearch, Searcher, SearcherType, SearchFailure} from "../search";
import {makeCancelable} from "../utils";
import {getEntriesFromPreparedCSV} from "../common/csvUtils";
import {vanillaDBEntryToResult} from "./utils";

import lunr from "lunr";
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.zh")(lunr);

function FixDBRowUsage() {}

// TODO(urgent): find out why on reload fuzzy json is being loaded in lunr mode
// TODO(urgent): find out why double-loads are happening / timers are running twice but not showing up
// TODO(urgent): brotli-compress (or split) lunr.json files, since AWS will not automatically gzip files above 10M
//              https://serviceworke.rs/cache-from-zip_worker_doc.html
// TODO(high): show match (use matchdata.metadata, for each key show each field)
// TODO(high): document the search symbols (hyphen, in particular, is confusing)
// TODO(mid): include <match></match>
// TODO(mid): indexing via ref that doesn't rely on the ID being set correctly.
//            error handling in case ids are out of order in DB? hash of ids?
// TODO: include list of objects to index into for search results
// TODO: catch errors on searches like "chines~"
// TODO: limit number of results from the search itself? ever necessary?

export default class LunrSearcher implements Searcher {
    searcherType: SearcherType = SearcherType.LUNR;
    dbName: string;
    langDB: LangDB;
    debug: boolean;

    private console: StubConsole;
    private idx?: lunr.Index;
    private entries?: DBRow[];

    constructor(dbName: DBShortName, langDB: LangDB, debug: boolean) {
        this.dbName = dbName;
        this.langDB = langDB;
        this.debug = debug;
        this.console = getDebugConsole(debug);
    }

    search(query: string): OngoingSearch | SearchFailure {
        const dbName = this.dbName;

        const searchResultPromise = async () => {
            if (this.idx === undefined) {
                console.warn("Tried to search before preparation: ", this);
                return SearchFailure.SearchedBeforePrepare;
            } else {
                this.console.time("lunr-search-" + dbName);
                const searchResults = this.idx.search(query);
                this.console.timeEnd("lunr-search-" + dbName);
                return searchResults;
            }
        };

        const cancelableSearchPromise = makeCancelable(searchResultPromise());

        const parsePromise = cancelableSearchPromise.then(results => {
            if ((results as lunr.Index.Result[]).reduce !== undefined) {
                if (this.entries !== undefined) {
                    return this.searchInternal(results as lunr.Index.Result[], this.entries);
                } else {
                    return SearchFailure.SearchedBeforePrepare;
                }
            } else {
                return results as SearchFailure;
            }
        });

        const cancelableParsePromise = makeCancelable(parsePromise);

        return new OngoingSearch(
            dbName,
            query,
            this.debug,
            cancelableSearchPromise,
            cancelableParsePromise,
        );
    }

    private searchInternal(
        results: lunr.Index.Result[],
        entries: DBRow[],
    ): PerDictResultsRaw {
        const dbName = this.dbName;
        const searchResults = results as lunr.Index.Result[];
        this.console.time("lunr-getEntries-" + dbName);

        // NOTE: Clipping results to display limit here, Lunr doesn't seem to have a built-in limit
        const clippedSearchResults = searchResults.slice(0, DISPLAY_RESULTS_LIMIT);

        const matchingEntries = clippedSearchResults.map((lunrRes) => {
            const id = parseInt(lunrRes.ref);
            const entry = entries[id - 1];
            const dbSearchRanking = {
                searcherType: SearcherType.LUNR,
                score: lunrRes.score
            } as DBSearchRanking;
            return vanillaDBEntryToResult(dbName, this.langDB.fullName, entry, dbSearchRanking);
        });
        this.console.timeEnd("lunr-getEntries-" + dbName);
        return {
            dbName,
            results: matchingEntries,
        } as PerDictResultsRaw;
    }

    // TODO: continue testing performance
    async prepare(): Promise<void> {
        const dbName = this.dbName;
        const {localCSV, localLunr, localLunrVersion} = this.langDB;
        this.console.time("lunr-total-" + dbName);

        this.console.time("lunr-total-entries-" + dbName);
        this.console.time("lunr-fetch-entries-" + dbName);
        const entriesFetchAndLoad = fetch(localCSV)
            .then((response: Response) => {
                return response.text();
            })
            .then((text: string) => {
                this.console.timeEnd("lunr-fetch-entries-" + dbName);

                this.console.time("lunr-loadfromcsv-" + dbName);
                const searchableEntries: DBRow[] = getEntriesFromPreparedCSV(text);
                this.entries = searchableEntries;
                this.console.timeEnd("lunr-loadfromcsv-" + dbName);

                this.console.timeEnd("lunr-total-entries-" + dbName);
            });

        this.console.time("lunr-total-index-" + dbName);
        this.console.time("lunr-fetch-index-" + dbName);
        let versionString = "";
        if (localLunrVersion) {
            versionString = `?v=${localLunrVersion}`;
        }
        const indexFetchAndLoad = fetch(localLunr + versionString)
            .then((response: Response) => {
                return response.text();
            })
            .then((text: string) => {
                this.console.timeEnd("lunr-fetch-index-" + dbName);

                this.console.time("lunr-index-parsejson-" + dbName);
                const obj = JSON.parse(text);

                this.console.time("lunr-index-parsejson-" + dbName);

                this.console.time("lunr-index-load-" + dbName);
                const idx = lunr.Index.load(obj);
                this.idx = idx;
                this.console.timeEnd("lunr-index-load-" + dbName);
                this.console.timeEnd("lunr-total-index-" + dbName);
            });

        return Promise.all([entriesFetchAndLoad, indexFetchAndLoad]).then(() => {
            this.console.timeEnd("lunr-total-" + dbName);
        });
    }

}

