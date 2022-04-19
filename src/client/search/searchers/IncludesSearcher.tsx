import {OngoingSearch, Searcher, SearcherPreparer, SearcherType, SearchFailure} from "../../search/searchers/Searcher";
import type {RawDBRow, SearchResultEntryRaw, SingleDBLoadStatus} from "../../types/dbTypes";
import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import {getEntriesFromPreparedCSV} from "../../common/csvUtils";
import {makeCancelable, sleep} from "../../utils";
import DBConfig from "../../configHandler/DBConfig";
import {SEARCH_RESULTS_LIMIT} from "../../search/searchers/constants";
import {vanillaDBEntryToResult} from "./utils";
import {CancelablePromise} from "../../types/general";
import {loadPublicFileAsPlainText} from "../../../common/utils";

export const LOWERCASE_KEY_SUFFIX = "_zzlc"
const NUM_TO_PROCESS_BEFORE_CANCEL_CHECK = 5000;

interface IncludesSearcherOpts {
    lowercase?: boolean,
}

export class IncludesSearcher implements Searcher {
    searcherType = SearcherType.INCLUDES;

    constructor(
        private includesDict: IncludesSearchableDict,
    ) {}

    search(query: string): OngoingSearch | SearchFailure {
        return this.includesDict.search(query);
    }

}

export class IncludesPreparer implements SearcherPreparer {
    console: StubConsole;
    opts: IncludesSearcherOpts;

    constructor(
        private dbConfig: DBConfig,
        private sendLoadStateUpdate: (stateDelta: Partial<SingleDBLoadStatus>) => void,
        private debug: boolean,
        opts?: IncludesSearcherOpts,
    ) {
        this.console = getDebugConsole(debug);
        this.prepare = this.prepare.bind(this);
        this.fetchAndPrepare = this.fetchAndPrepare.bind(this);
        this.opts = opts ?? {};
    }

    async prepare(): Promise<Searcher> {
        return this
            .fetchAndPrepare()
            .then((includesDict) => {
                return new IncludesSearcher(includesDict);
            });
    }

    async fetchAndPrepare(): Promise<IncludesSearchableDict> {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        const {localCSV} = this.dbConfig.getDBLoadInfo();
        if (localCSV === undefined) {
            const errMsg = `Includes search requires a local CSV to be defined! (${dbIdentifier})`;
            throw new Error(errMsg);
        }
        this.console.time("total-" + dbIdentifier);
        this.console.time("fetch-" + dbIdentifier);

        const text = await loadPublicFileAsPlainText(
            localCSV,
            async () => this.sendLoadStateUpdate({isDownloaded: true})
        );
        this.sendLoadStateUpdate({isParsed: true});
        const includesSearchableDict = this.convertCSVToIncludesSearchableDict(text);
        return includesSearchableDict;
    }

    convertCSVToIncludesSearchableDict(text: string): IncludesSearchableDict {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        this.console.timeEnd("fetch-" + dbIdentifier);

        this.console.time("csvConvertPrePrepped-" + dbIdentifier);
        const entries: RawDBRow[] = getEntriesFromPreparedCSV(text);
        this.console.timeEnd("csvConvertPrePrepped-" + dbIdentifier);


        if (this.opts?.lowercase) {
            this.console.time("lowercase-" + dbIdentifier);
            entries.forEach((entry) => {
                Object.keys(entry).forEach((key) => {
                    entry[key + LOWERCASE_KEY_SUFFIX] = entry[key].toLowerCase()
                });
            });
            this.console.timeEnd("lowercase-" + dbIdentifier);
        }


        this.console.timeEnd("total-" + dbIdentifier);

        const primaryKey = this.dbConfig.getPrimaryKey();

        return new IncludesSearchableDict(this.dbConfig, entries, this.debug, primaryKey, this.opts);
    }

}

class IncludesSearchableDict {
    console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private entries: Array<RawDBRow>,
        private debug: boolean,
        private primaryKey: string,
        private opts: IncludesSearcherOpts,
    ) {
        this.console = getDebugConsole(debug);
        this.search = this.search.bind(this);
    }

    searchINTERNAL(query: string): CancelablePromise<RawDBRow[]> {
        let isCanceled = false;

        const wrappedPromise: Partial<CancelablePromise<RawDBRow[]>> = new Promise(async (resolve, _reject) => {
            let q = query;
            let i = 0;

            if (this.opts.lowercase) {
                q = query.toLowerCase();
            }

            let numMatches = 0;

            const results = [];

            for (const entry of this.entries) {
                if (isCanceled) { resolve([]); break; }

                if (numMatches < SEARCH_RESULTS_LIMIT) {
                    const isMatch = this.checkEntry(q, entry)
                    if (isMatch) {
                        results.push(entry);
                        numMatches++;
                    }
                }

                if (i !== 0 && (i % NUM_TO_PROCESS_BEFORE_CANCEL_CHECK) === 0) {
                    await sleep(1);
                }
                i++;
            }
            resolve(results);
        });

        wrappedPromise.cancel = () => { isCanceled = true };

        return wrappedPromise as CancelablePromise<RawDBRow[]>;
    }

    checkEntry(q: string, entry: RawDBRow) {
        const searchableFields = this.dbConfig.getSearchableFieldIDs();
        return searchableFields.some((fieldName) => {
            let f = fieldName;
            if (this.opts.lowercase) {
                f = fieldName + LOWERCASE_KEY_SUFFIX;
            }

            if (f in entry) {
                return entry[f].includes(q);
            } else {
                this.console.warn(`Unknown key "${f}":`, entry);
                return false;
            }
        });
    }

    search(
        query: string,
    ): OngoingSearch | SearchFailure {
        const dbIdentifier = this.dbConfig.getDBIdentifier();

        const cancelableSearchPromise = this.searchINTERNAL(query);
        const cancelableParsePromise = makeCancelable(cancelableSearchPromise.then(
            rawResults => {
                const results: SearchResultEntryRaw[] = rawResults.map((row, index) => vanillaDBEntryToResult(
                    this.dbConfig.getDBIdentifier(),
                    row,
                    {
                        searcherType: SearcherType.INCLUDES,
                        score: index,
                    },
                    this.primaryKey,



                ));
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
