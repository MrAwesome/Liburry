import {getWorkerDebugConsole, StubConsole} from "./debug_console";
import {DBName, PerDictResults} from "./types";
import {CancelablePromise} from "./fuzzySortTypes";

interface Searcher {
    dbName: DBName;
    constructor(dbName: DBName): this;
    init(): void;
    prepare(): void;
    search(query: string): OngoingSearch | null;
}

// TODO: type promises
// TODO: make less fuzzysort-specific
export class OngoingSearch {
    dbName: DBName;
    query: string;
    cancelablePromise?: CancelablePromise<any>;
    parsePromise?: Promise<PerDictResults | null>;
    completed: boolean;
    wasCanceled: boolean = false;
    console: StubConsole;

    constructor(
        dbName: DBName,
        query: string = "",
        debug: boolean,
        cancelablePromise?: CancelablePromise<any>,
        parsePromise?: Promise<PerDictResults | null>,
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
