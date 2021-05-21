import {getWorkerDebugConsole, StubConsole} from "./debug_console";
import {DBName, PerDictResults} from "./types";
import fuzzysort from "fuzzysort";
import {parseFuzzySortResultsForRender} from "./fuzzySortUtils";
import {DATABASES} from "./search_options";
import {CancelablePromise, FuzzySearchableDict} from "./fuzzySortTypes";

interface Searcher {
    dbName: DBName;
    constructor(dbName: DBName): this;
    init(): void;
    prepare(): void;
    search(query: string): OngoingSearch | null;
}

// TODO: type promises
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

// TODO: make generic and allow for multiple search types
export function searchFuzzySort(
    searchableDict: FuzzySearchableDict | null,
    query: string,
    debug: boolean,
): OngoingSearch | null {
    const debugConsole = getWorkerDebugConsole(debug);
    // TODO: re-trigger currently-ongoing search once db loads?
    if (searchableDict === null) {
        return null;
    }

    const {dbName, searchableEntries} = searchableDict;
    const langDB = DATABASES.get(dbName);
    if (!langDB) {
        debugConsole.log("Failed to load langDB:", dbName, DATABASES);
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
            // Filter out duplicates, as fuzzysort occasionally gives them to us and React loathes duplicate keys
            // TODO: Find out why this doesn't prevent the flash of warning text from react
            const seen = new Set();
            const res = rawResults.filter(({obj}) => {
                if (seen.has(obj.d)) {
                    return false;
                }
                seen.add(obj.d);
                return true;
            });
            ongoingSearch.markCompleted();
            const results = parseFuzzySortResultsForRender(
                dbName,
                // @ts-ignore Deal with lack of fuzzysort interfaces
                res,
            );
            return {
                dbName,
                results
            } as PerDictResults;
        }
    ).catch(
        (reason) => {
            debugConsole.log(reason);
            return null;
        }
    );

    const ongoingSearch = new OngoingSearch(dbName, query, debug, cancelableSearchPromise, parsePromise);

    return ongoingSearch;
}
