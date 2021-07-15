import getDebugConsole, {StubConsole} from "./getDebugConsole";
import {DBName, LangDB, PerDictResultsRaw} from "./types/dbTypes";
import {CancelablePromise} from "./types/general";
import FuzzySortSearcher, {FUZZY_SCORE_LOWER_THRESHOLD} from "./search/FuzzySortSearcher";
import LunrSearcher from "./search/LunrSearcher";

export interface Searcher {
    searcherType: SearcherType;
    dbName: DBName;
    langDB: LangDB;
    debug: boolean;
    prepare(): Promise<void>;
    search(query: string): OngoingSearch | SearchFailure;
}

export enum SearcherType {
    FUZZYSORT = "FUZZYSORT",
    LUNR = "LUNR"
}

// TODO: make a helper function to compare two search results, and use in SearchResultsHolder
export interface DBSearchRanking {
    searcherType: SearcherType;
    score: number;
}

// TODO: store this information further away from this module, closer to where searchers are defined
//       (would be easiest with an abstract static, but those don't seem to exist in typescript right now)
export function getMaxScore(searcherType: SearcherType): number {
    switch (searcherType) {
        case SearcherType.FUZZYSORT:
            return FUZZY_SCORE_LOWER_THRESHOLD;
        case SearcherType.LUNR:
            // TODO: some normalized value for this
            return 25;
    }
}

export function getSearcher(searcherType: SearcherType, dbName: DBName, langDB: LangDB, debug: boolean): Searcher {
    switch (searcherType) {
        case SearcherType.FUZZYSORT:
            return new FuzzySortSearcher(dbName, langDB, debug);
        case SearcherType.LUNR:
            // TODO: implement for lunr
            return new LunrSearcher(dbName, langDB, debug);
    }
}

export enum SearchFailure {
    FuzzyNoSearchableDict = "FuzzyNoSearchableDict",
    FuzzyFailedToLoadLangDB = "FuzzyFailedToLoadLangDB",
    ParsePromiseFailed = "FuzzyParsePromiseFailed",
    SearchedBeforePrepare = "SearchedBeforePrepare",
}

// TODO: type promises
export class OngoingSearch {
    dbName: DBName;
    query: string;
    searchPromise?: CancelablePromise<any>;
    parsePromise?: CancelablePromise<PerDictResultsRaw | SearchFailure>;
    completed: boolean;
    wasCanceled: boolean = false;
    console: StubConsole;

    constructor(
        dbName: DBName,
        query: string = "",
        debug: boolean,
        searchPromise?: CancelablePromise<any>,
        parsePromise?: CancelablePromise<PerDictResultsRaw | SearchFailure>,
    ) {
        this.console = getDebugConsole(debug);
        this.console.time("asyncSearch-" + dbName);
        this.query = query;
        this.dbName = dbName;

        if (query === "") {
            this.completed = true;
        } else {
            this.completed = false;
            this.searchPromise = searchPromise;
            this.parsePromise = parsePromise;
        }
    }

    getQuery(): string {
        return this.query;
    }

    isCompleted(): boolean {
        return this.completed;
    }

    markCompleted(): void {
        this.completed = true;
        this.console.timeEnd("asyncSearch-" + this.dbName);
    }

    markCanceled(): void {
        this.wasCanceled = true;
        this.markCompleted();
    }

    endTimer(): void {
    }

    cancel(): void {
        if (!this.isCompleted()) {
            if (this.searchPromise) {
                this.searchPromise.cancel();
            }
            if (this.parsePromise) {
                this.parsePromise.cancel();
            }
            this.markCanceled();
        }
    }
}
