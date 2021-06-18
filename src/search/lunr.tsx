import type {DBName, LangDB, PerDictResults} from "../types/dbTypes";

import {DISPLAY_RESULTS_LIMIT} from "../searchSettings";
import getDebugConsole, {StubConsole} from "../getDebugConsole";
import {OngoingSearch, Searcher, SearcherType, SearchFailure} from "../search";
import {makeCancelable} from "../utils";
import {getEntriesFromPreparedCSV} from "../common/csvUtils";
import {DBEntry} from "../common/dbTypes";
import {vanillaDBEntryToResult} from "./lunrUtils";

import lunr from "lunr";
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.zh")(lunr);


// TODO(urgent): find out why on reload fuzzy json is being loaded in lunr mode
// TODO(urgent): find out why double-loads are happening / timers are running twice but not showing up
// TODO(urgent): brotli-compress lunr.json files, since AWS will not automatically gzip files above 10M
//              https://serviceworke.rs/cache-from-zip_worker_doc.html
// TODO(high): show match (use matchdata.metadata, for each key show each field)
// TODO: include list of objects to index into for search results
// TODO: catch errors on searches like "chines~"
// TODO: include match data?
// TODO: pull in lunr index
// TODO: pull in CSV with papaparse
// TODO: error handling in case ids are out of order in DB? hash of ids?
// TODO: limit number of results
//
// DOC: does not support chinese characters in search strings

export class LunrSearcher implements Searcher {
    searcherType: SearcherType = SearcherType.LUNR;
    dbName: string;
    langDB: LangDB;
    debug: boolean;

    private console: StubConsole;
    private idx?: lunr.Index;
    private entries?: DBEntry[];

    constructor(dbName: DBName, langDB: LangDB, debug: boolean) {
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
            if ((results as lunr.Index.Result[]).length !== undefined) {
                if (this.entries !== undefined) {
                    const searchResults = results as lunr.Index.Result[];
                    this.console.time("lunr-getEntries-" + dbName);

                    // NOTE: Clipping results to display limit here, Lunr doesn't seem to have a built-in limit
                    const clippedSearchResults = searchResults.slice(0, DISPLAY_RESULTS_LIMIT);

                    const entries = this.entries;
                    const matchingEntries = clippedSearchResults.map((lunrRes) => {
                        // TODO: less danger-prone / more future-proof indexing
                        const id = parseInt(lunrRes.ref);
                        const entry = entries[id - 1];
                        return vanillaDBEntryToResult(dbName, entry, lunrRes);
                    });
                    this.console.timeEnd("lunr-getEntries-" + dbName);
                    return {
                        dbName,
                        results: matchingEntries,
                    } as PerDictResults;
                } else {
                    return SearchFailure.SearchedBeforePrepare;
                }
            } else {
                return results as SearchFailure;
            }
        });

        const cancelableParsePromise = makeCancelable(parsePromise);


        // TODO: add search promise
        // TODO: add parse promise
        return new OngoingSearch(
            dbName,
            query,
            this.debug,
            cancelableSearchPromise,
            cancelableParsePromise,
        );
    }

    // TODO: continue testing performance
    async prepare(): Promise<void> {
        const dbName = this.dbName;
        const {localCSV, localLunr} = this.langDB;
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
                const searchableEntries: DBEntry[] = getEntriesFromPreparedCSV(text);
                this.entries = searchableEntries;
                this.console.timeEnd("lunr-loadfromcsv-" + dbName);

                this.console.timeEnd("lunr-total-entries-" + dbName);
            });

        this.console.time("lunr-total-index-" + dbName);
        this.console.time("lunr-fetch-index-" + dbName);
        const indexFetchAndLoad = fetch(localLunr)
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

