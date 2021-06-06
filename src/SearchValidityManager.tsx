import {RETRY_ATTEMPTS} from "./searchSettings";
import {DBName} from "./types/dbTypes";
import {mod} from "./utils";

class SearchContext {
    invalidated: boolean = false;
    completionStatus: Map<DBName, boolean> = new Map();
    retries: Map<DBName, number> = new Map();

    clear() {
        this.invalidated = false;
        this.completionStatus.clear();
        this.retries.clear();
    }

    invalidate() {
        this.invalidated = true;
    }

    valid() {
        return this.invalidated;
    }
}

export default class SearchInvalidationAndRetryManager {
    private bufLen: number = 10;
//    private searchCompletionStatus: Array<Map<DBName, boolean>> = Array.from({length: this.bufLen}).map(_ => new Map());
//    private retries: Array<Map<DBName, number>> = Array.from({length: this.bufLen}).map(_ => new Map());
//    private searchInvalidations: Array<boolean> = Array.from({length: this.bufLen}).map(_ => false);

    private searches: Array<SearchContext> = Array.from({length: this.bufLen}).map(_ => new SearchContext());

    initialSearchID: number = 0;
    currentSearchID: number = this.initialSearchID;

    private getSearch(searchID: number): SearchContext {
        return this.searches[searchID];
    }

    private getCurrentSearch(): SearchContext {
        return this.searches[this.currentSearchID];
    }

    // Bump the counter, wait for the next search to start
    bump() {
        this.currentSearchID = mod(this.currentSearchID + 1, this.bufLen);
        this.getCurrentSearch().clear();
    }

    // Check if the named search can return results
    isInvalidated(searchID: number): boolean {
        return this.getSearch(searchID).valid();
    }

    // Invalidate the previous search
    invalidate() {
        const index = mod(this.currentSearchID - 1, this.bufLen);
        this.getSearch(index).invalidate();
    }

    // Check if the named DB can retry for the named searchID
    acquireRetry(dbName: DBName, searchID: number) {
        const currentAttempt = this.getSearch(searchID).retries;
        const retries = currentAttempt.get(dbName);
        if (retries === undefined) {
            currentAttempt.set(dbName, RETRY_ATTEMPTS - 1);
            return true;
        } else {
            if (retries > 0) {
                currentAttempt.set(dbName, retries - 1);
                return true;
            } else {
                return false;
            }
        }
    }

    checkAllSearchesCompleted(searchID: number): boolean {
        const completions = this.getSearch(searchID).completionStatus;
        for (const [_dbName, isCompleted] of completions) {
            if (!isCompleted) {
                return false;
            }
        }
        return true;
    }

    // NOTE: could check here if search was already started, but as long
    //       as we're always clearing it shouldn't be a problem
    startSearches(dbNames: DBName[]) {
        for (const dbName in dbNames) {
            this.getCurrentSearch().completionStatus.set(dbName, false)
        }
    }

    markSearchCompleted(dbName: DBName, searchID: number) {
        this.getSearch(searchID).completionStatus.set(dbName, true)
    }

}
