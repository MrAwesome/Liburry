import type {DBSearchRanking, RawDBRow, PerDictResultsRaw, SingleDBLoadStatus} from "../../types/dbTypes";

import {DISPLAY_RESULTS_LIMIT} from "../../search/searchers/constants";
import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import {OngoingSearch, Searcher, SearcherPreparer, SearcherType, SearchFailure} from "../../search/searchers/Searcher";
import {makeCancelable} from "../../utils";
import {getEntriesFromPreparedCSV} from "../../common/csvUtils";
import {vanillaDBEntryToResult} from "./utils";
import DBConfig from "../../configHandler/DBConfig";
import {DBIdentifier} from "../../configHandler/zodConfigTypes";

import lunr from "lunr";
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.zh")(lunr);

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

export class LunrPreparer implements SearcherPreparer {
    private console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private sendLoadStateUpdate: (stateDelta: Partial<SingleDBLoadStatus>) => void,
        private debug: boolean,
    ) {
        this.console = getDebugConsole(debug);
        this.prepare = this.prepare.bind(this);
    }

    async prepare(): Promise<Searcher> {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        // XXX TODO: document that this needs both, and needs incremental IDs etc
        const {localCSV, localLunr} = this.dbConfig.getDBLoadInfo();

        if (localCSV === undefined || localLunr === undefined) {
            const errMsg = `Lunr search requires both a CSV and a pre-generated lunr index for that CSV! (${dbIdentifier})`;
            throw new Error(errMsg);
        }
        this.console.time("lunr-total-" + dbIdentifier);

        this.console.time("lunr-total-entries-" + dbIdentifier);
        this.console.time("lunr-fetch-entries-" + dbIdentifier);
        const entriesFetchAndLoad = fetch(localCSV)
            .then((response: Response) => {
                return response.text();
            })
            .then((text: string) => {
                this.console.timeEnd("lunr-fetch-entries-" + dbIdentifier);

                this.console.time("lunr-loadfromcsv-" + dbIdentifier);
                const searchableEntries: RawDBRow[] = getEntriesFromPreparedCSV(text);
                this.console.timeEnd("lunr-loadfromcsv-" + dbIdentifier);

                this.console.timeEnd("lunr-total-entries-" + dbIdentifier);
                return searchableEntries;
            });

        this.console.time("lunr-total-index-" + dbIdentifier);
        this.console.time("lunr-fetch-index-" + dbIdentifier);
        const indexFetchAndLoad = fetch(localLunr)
            .then((response: Response) => {
                // NOTE: just sending status updates from here, since the indices are *MUCH* larger than the CSVs
                //       if desired, isDownloaded etc can become e.g. downloadProgress
                this.sendLoadStateUpdate({isDownloaded: true});
                return response.text();
            })
            .then((text: string) => {
                this.console.timeEnd("lunr-fetch-index-" + dbIdentifier);

                this.console.time("lunr-index-parsejson-" + dbIdentifier);
                const obj = JSON.parse(text);

                this.console.time("lunr-index-parsejson-" + dbIdentifier);

                this.console.time("lunr-index-load-" + dbIdentifier);
                const idx = lunr.Index.load(obj);
                this.console.timeEnd("lunr-index-load-" + dbIdentifier);
                this.console.timeEnd("lunr-total-index-" + dbIdentifier);
                this.sendLoadStateUpdate({isParsed: true});
                return idx;
            });

        const primaryKey = this.dbConfig.getPrimaryKey();

        return Promise.all([entriesFetchAndLoad, indexFetchAndLoad]).then(([entries, idx]) => {
            const searcher = new LunrSearcher(dbIdentifier, primaryKey, idx, entries, this.debug);
            this.console.timeEnd("lunr-total-" + dbIdentifier);
            return searcher;
        });
    }
}

export class LunrSearcher implements Searcher {
    searcherType: SearcherType = SearcherType.DISABLED_LUNR;

    private console: StubConsole;

    constructor(
        private dbIdentifier: DBIdentifier,
        private primaryKey: string,
        private idx: lunr.Index,
        private entries: RawDBRow[],
        private debug: boolean,
    ) {
        this.console = getDebugConsole(debug);
    }

    search(query: string): OngoingSearch | SearchFailure {
        const dbIdentifier = this.dbIdentifier;

        const searchResultPromise = async () => {
            this.console.time("lunr-search-" + dbIdentifier);
            const searchResults = this.idx.search(query);
            this.console.timeEnd("lunr-search-" + dbIdentifier);
            return searchResults;
        };

        const cancelableSearchPromise = makeCancelable(searchResultPromise());

        const parsePromise = cancelableSearchPromise.then(results => {
            return this.searchInternal(results as lunr.Index.Result[], this.entries);
        });

        const cancelableParsePromise = makeCancelable(parsePromise);

        return new OngoingSearch(
            dbIdentifier,
            query,
            this.debug,
            cancelableSearchPromise,
            cancelableParsePromise,
        );
    }

    private searchInternal(
        results: lunr.Index.Result[],
        entries: RawDBRow[],
    ): PerDictResultsRaw {
        const dbIdentifier = this.dbIdentifier;
        const searchResults = results as lunr.Index.Result[];
        this.console.time("lunr-getEntries-" + dbIdentifier);

        // NOTE: Clipping results to display limit here, Lunr doesn't seem to have a built-in limit
        const clippedSearchResults = searchResults.slice(0, DISPLAY_RESULTS_LIMIT);

        const matchingEntries = clippedSearchResults.map((lunrRes) => {
            const id = parseInt(lunrRes.ref);
            const entry = entries[id - 1];
            const dbSearchRanking = {
                searcherType: SearcherType.DISABLED_LUNR,
                score: lunrRes.score
            };
            return vanillaDBEntryToResult(dbIdentifier, entry, dbSearchRanking, this.primaryKey);
        });
        this.console.timeEnd("lunr-getEntries-" + dbIdentifier);
        return {
            dbIdentifier,
            results: matchingEntries,
        };
    }
}
