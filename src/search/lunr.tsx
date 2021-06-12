import lunr from "lunr";

//import type {DBName, PerDictResults, SearchResultEntry, LangDB, RawJSONEntry, ShortNameToPreppedNameMapping} from "../types/dbTypes";
import type {DBName, LangDB, RawJSONEntry} from "../types/dbTypes";

// TODO: remove when there are other types of search
//import {DATABASES, DISPLAY_RESULTS_LIMIT} from "../searchSettings";
//import {SearchFailure, OngoingSearch} from "./search";
import getDebugConsole, {StubConsole} from "../getDebugConsole";
import {OngoingSearch, Searcher, SearcherType, SearchFailure} from "../search";
import {makeCancelable} from "../utils";
//import {makeCancelable} from "./utils";

// TODO: include list of objects to index into for search results

export class LunrSearcher implements Searcher {
    searcherType: SearcherType = SearcherType.LUNR;
    dbName: string;
    langDB: LangDB;
    debug: boolean;

    private console: StubConsole;
    private idx?: lunr.Index;

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
                const search = this.idx.search(query);
                this.console.timeEnd("lunr-search-" + dbName);
                console.log(query, search);
                this.console.timeEnd("lunr-total-" + dbName);
                // XXX TODO: return here
                return SearchFailure.FuzzyFailedToLoadLangDB;
            }
        };

        // TODO: add search promise
        // TODO: add parse promise
        return new OngoingSearch(
            dbName,
            query,
            this.debug,
            makeCancelable(searchResultPromise()),
        );
    }

    // TODO: continue testing performance
    async prepare(): Promise<void> {
        const dbName = this.dbName;
        const {upstreamCSV} = this.langDB;
        this.console.time("lunr-total-" + dbName);
        this.console.time("lunr-fetch-" + dbName);
        return fetch(upstreamCSV)
            .then((response: Response) => {
                return response.text();
            })
            .then((text: string) => {
                this.console.timeEnd("lunr-fetch-" + dbName);
                this.console.time("lunr-jsonConvertPrePrepped-" + dbName);
                const searchableEntries: RawJSONEntry[] = JSON.parse(text);
                this.console.timeEnd("lunr-jsonConvertPrePrepped-" + dbName);
                this.console.time("lunr-index-" + dbName);
                //
                /// XXX : TODO : offload this work to Node.
                // TODO: use enum/var names
                this.idx = lunr(function () {
                    this.ref("d");
                    this.field("e");
                    this.field("p");
                    this.field("n");
                    this.field("h");
                    this.field("i");

                    searchableEntries.forEach((entry) => {
                        this.add(entry)
                    }, this)
                });
                this.console.timeEnd("lunr-index-" + dbName);
                /// XXX XXX
//                this.console.log(this.idx);
//                const FUCK = JSON.stringify(this.idx);
//                console.log("FUCK", FUCK);
//                console.time("FUCKFUCK");
//                const obj = JSON.parse(FUCK);
//                console.timeEnd("FUCKFUCK");
//                console.time("FUCKFUCK2");
//                const indx = lunr.Index.load(obj);
//                console.timeEnd("FUCKFUCK2");
            });
    }

}

