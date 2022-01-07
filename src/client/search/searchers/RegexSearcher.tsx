import {OngoingSearch, Searcher, SearcherPreparer, SearcherType, SearchFailure} from "../../search/searchers/Searcher";
import type {RawDBRow, SearchResultEntryRaw, SingleDBLoadStatus} from "../../types/dbTypes";
import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import {getEntriesFromPreparedCSV} from "../../common/csvUtils";
import {makeCancelable, sleep} from "../../utils";
import {DBConfig} from "../../types/config";
import {SEARCH_RESULTS_LIMIT} from "../../search/searchers/constants";
import {vanillaDBEntryToResult} from "./utils";
import {CancelablePromise} from "../../types/general";

const NUM_TO_PROCESS_BEFORE_CANCEL_CHECK = 5000;

export class RegexSearcherOpts {
    caseInsensitive?: boolean = true; // TODO: add selector
    fullUnicode?: boolean = true; // TODO: add selector
    showMatches?: boolean = false; // TODO: implement
}

export class RegexSearcher implements Searcher {
    searcherType = SearcherType.REGEX;

    constructor(
        private regexDict: RegexSearchableDict,
    ) {}

    search(query: string): OngoingSearch | SearchFailure {
        return this.regexDict.search(query);
    }

}

export class RegexPreparer implements SearcherPreparer {
    console: StubConsole;
    opts: RegexSearcherOpts;

    constructor(
        private dbConfig: DBConfig,
        private sendLoadStateUpdate: (stateDelta: Partial<SingleDBLoadStatus>) => void,
        private debug: boolean,
        opts?: RegexSearcherOpts,
    ) {
        this.console = getDebugConsole(debug);
        this.prepare = this.prepare.bind(this);
        this.fetchAndPrepare = this.fetchAndPrepare.bind(this);
        this.opts = opts ?? {};
    }

    async prepare(): Promise<Searcher> {
        return this
            .fetchAndPrepare()
            .then((regexDict) => {
                return new RegexSearcher(regexDict);
            });
    }

    async fetchAndPrepare(): Promise<RegexSearchableDict> {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        const {localCSV} = this.dbConfig.getDBLoadInfo();
        if (localCSV === undefined) {
            const errMsg = `Regex search requires a local CSV to be defined! (${dbIdentifier})`;
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
                return this.convertCSVToRegexSearchableDict(text);
            });
    }

    convertCSVToRegexSearchableDict(text: string): RegexSearchableDict {
        const dbIdentifier = this.dbConfig.getDBIdentifier();
        this.console.timeEnd("fetch-" + dbIdentifier);

        this.console.time("csvConvertPrePrepped-" + dbIdentifier);
        const entries: RawDBRow[] = getEntriesFromPreparedCSV(text);
        this.console.timeEnd("csvConvertPrePrepped-" + dbIdentifier);

        this.console.timeEnd("total-" + dbIdentifier);

        const primaryKey = this.dbConfig.getPrimaryKey();

        return new RegexSearchableDict(this.dbConfig, entries, this.debug, primaryKey, this.opts);
    }

}

class RegexSearchableDict {
    console: StubConsole;

    constructor(
        private dbConfig: DBConfig,
        private entries: Array<RawDBRow>,
        private debug: boolean,
        private primaryKey: string,
        private opts: RegexSearcherOpts,
    ) {
        this.console = getDebugConsole(debug);
        this.search = this.search.bind(this);
    }

    searchINTERNAL(query: string): CancelablePromise<RawDBRow[]> {
        let isCanceled = false;

        const wrappedPromise: Partial<CancelablePromise<RawDBRow[]>> = new Promise(async (resolve, _reject) => {
            let flags = "";
            const {caseInsensitive, fullUnicode} = this.opts;

            if (caseInsensitive) { flags += "i"; }
            if (fullUnicode) { flags += "u"; }

            const regex = new RegExp(query, flags);

            const results = [];
            let numMatches = 0;
            let i = 0;
            for (const entry of this.entries) {
                if (isCanceled) { resolve([]); break; }

                if (numMatches < SEARCH_RESULTS_LIMIT) {
                    const isMatch = this.checkEntry(regex, entry)
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

    checkEntry(r: RegExp, entry: RawDBRow) {
        const searchableFields = this.dbConfig.getSearchableFields();
        return searchableFields.some((fieldName) => {
            if (fieldName in entry) {
                return r.test(entry[fieldName]);
            } else {
                this.console.warn(`Unknown key "${fieldName}":`, entry);
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
                        searcherType: SearcherType.REGEX,
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
