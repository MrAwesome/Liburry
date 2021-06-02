import getDebugConsole, {StubConsole} from "./getDebugConsole";
import {DBName, LangDB, PerDictResults} from "./types/dbTypes";
import {CancelablePromise} from "./types/general";
import FuzzySortSearcher from "./FuzzySortSearcher";

export interface Searcher {
    searcherType: SearcherType;
    dbName: DBName;
    langDB: LangDB;
    debug: boolean;
    prepare(): Promise<void>;
    search(query: string): OngoingSearch | SearchFailure;
}

export enum SearcherType {
    FuzzySort = "FuzzySort"
}

export function getSearcher(searcherType: SearcherType, dbName: DBName, langDB: LangDB, debug: boolean): Searcher {
    switch (searcherType) {
        case SearcherType.FuzzySort:
            return new FuzzySortSearcher(dbName, langDB, debug);
    }
}

export enum SearchFailure {
    FuzzyNoSearchableDict = "FuzzyNoSearchableDict",
    FuzzyFailedToLoadLangDB = "FuzzyFailedToLoadLangDB",
    FuzzyParsePromiseFailed = "FuzzyParsePromiseFailed",
    FuzzySearchedBeforePrepare = "FuzzySearchedBeforePrepare",
}

// TODO: type promises
export class OngoingSearch {
    dbName: DBName;
    query: string;
    searchPromise?: CancelablePromise<any>;
    parsePromise?: CancelablePromise<PerDictResults | SearchFailure>;
    completed: boolean;
    wasCanceled: boolean = false;
    console: StubConsole;

    constructor(
        dbName: DBName,
        query: string = "",
        debug: boolean,
        searchPromise?: CancelablePromise<any>,
        parsePromise?: CancelablePromise<PerDictResults | SearchFailure>,
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
