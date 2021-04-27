import debugConsole from "./debug_console";
import {DBName, CancelablePromise, KeyResults, SearchableDict, PerDictResultsElements} from "./types";
import fuzzysort from "fuzzysort";
import {parseFuzzySortResultsForRender} from "./search_results_entities";
import {DATABASES} from "./search_options";

export class OngoingSearch {
    dbName: DBName;
    query: string;
    promise?: CancelablePromise<any>;
    completed: boolean;

    constructor(dbName: DBName, query: string = "", promise?: CancelablePromise<any>) {
        debugConsole.time("asyncSearch-" + dbName);
        this.query = query;
        this.dbName = dbName;

        if (query === "") {
            this.completed = true;
        } else {
            this.completed = false;
            this.promise = promise;
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

    cancel(): void {
        if (this.promise && !this.isCompleted()) {
            this.promise.cancel();
            this.markCompleted();
        }
    }
}

// TODO: make generic and allow for multiple search types
export function searchDB(
    searchableDict: SearchableDict,
    query: string,
    appendSearchFunc: ((ongoingSearch: OngoingSearch) => void),
    appendResultsFunc: ((results: PerDictResultsElements) => void),

) {
    const {dbName, searchableEntries} = searchableDict;
    const langDB = DATABASES.get(dbName);
    if (!langDB) {
        console.log("Failed to load langDB:", dbName, DATABASES);
        return;
    }
    const {fuzzyOpts} = langDB;
    const newSearchPromise = fuzzysort.goAsync(
        query,
        searchableEntries,
        fuzzyOpts, // TODO: get from langdb
    );

    const newSearch = new OngoingSearch(dbName, query, newSearchPromise);
    newSearchPromise.then(
        raw_results => {
            newSearch.markCompleted();
            const results = parseFuzzySortResultsForRender(
                // @ts-ignore Deal with lack of fuzzysort interfaces
                raw_results,
            );
            appendResultsFunc({
                dbName,
                results
            });

        }
    ).catch(debugConsole.log);

    appendSearchFunc(newSearch);
}
