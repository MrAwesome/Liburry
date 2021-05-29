import {getWorkerDebugConsole, StubConsole} from "./debug_console";
import {DBName, LangDB, PerDictResults} from "./types";
import {CancelablePromise} from "./fuzzySortTypes";
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
// TODO: find a generic cancelable promise to use instead of fuzzysort's
export class OngoingSearch {
    dbName: DBName;
    query: string;
    cancelablePromise?: CancelablePromise<any>;
    parsePromise?: Promise<PerDictResults | SearchFailure>;
    completed: boolean;
    wasCanceled: boolean = false;
    console: StubConsole;

    constructor(
        dbName: DBName,
        query: string = "",
        debug: boolean,
        cancelablePromise?: CancelablePromise<any>,
        parsePromise?: Promise<PerDictResults | SearchFailure>,
    ) {
        this.console = getWorkerDebugConsole(debug);
        this.console.time("asyncSearch-" + dbName);
        this.query = query;
        this.dbName = dbName;

        if (query === "") {
            this.completed = true;
        } else {
            this.completed = false;
            this.cancelablePromise = cancelablePromise;
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

    // TODO: cancel parsepromise, if possible
    cancel(): void {
        if (this.cancelablePromise && !this.isCompleted()) {
            this.cancelablePromise.cancel();
            this.markCanceled();
        }
    }
}
