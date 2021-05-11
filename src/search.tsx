import debugConsole from "./debug_console";
import {DBName, CancelablePromise, SearchableDict, PerDictResultsElements} from "./types";
import fuzzysort from "fuzzysort";
import {parseFuzzySortResultsForRender} from "./search_results_entities";
import {DATABASES} from "./search_options";

// TODO: type promises
export class OngoingSearch<T> {
    dbName: DBName;
    query: string;
    cancelablePromise?: CancelablePromise<any>;
    parsePromise?: Promise<T>;
    completed: boolean;
    wasCanceled: boolean = false;

    constructor(dbName: DBName, query: string = "", cancelablePromise?: CancelablePromise<any>, parsePromise?: Promise<T>) {
        debugConsole.time("asyncSearch-" + dbName);
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
        debugConsole.timeEnd("asyncSearch-" + this.dbName);
    }

    markCanceled(): void {
        this.wasCanceled = true;
        this.markCompleted();
    }

    endTimer(): void {
    }

    cancel(): void {
        if (this.cancelablePromise && !this.isCompleted()) {
            this.cancelablePromise.cancel();
            this.markCanceled();
        }
    }
}

// TODO: make generic and allow for multiple search types
export function searchDB(
    searchableDict: SearchableDict | null,
    query: string,
): OngoingSearch<PerDictResultsElements> | null {
    // TODO: re-trigger currently-ongoing search once db loads?
    if (searchableDict === null) {
        return null;
    }

    const {dbName, searchableEntries} = searchableDict;
    const langDB = DATABASES.get(dbName);
    if (!langDB) {
        console.log("Failed to load langDB:", dbName, DATABASES);
        return null;
    }
    const {fuzzyOpts} = langDB;
    const cancelableSearchPromise = fuzzysort.goAsync(
        query,
        searchableEntries,
        fuzzyOpts, // TODO: get from langdb
    );

    const parsePromise = cancelableSearchPromise.then(
        rawResults => {
            ongoingSearch.markCompleted();
            const results = parseFuzzySortResultsForRender(
                dbName,
                // @ts-ignore Deal with lack of fuzzysort interfaces
                rawResults,
            );
            return {
                dbName,
                results
            } as PerDictResultsElements;

        }
    ).catch(debugConsole.log);

    const ongoingSearch = new OngoingSearch(dbName, query, cancelableSearchPromise, parsePromise);

    return ongoingSearch;
}
