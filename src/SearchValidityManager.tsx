import {RETRY_ATTEMPTS} from "./search_options";
import {DBName} from "./types";
import {mod} from "./utils";

export default class SearchInvalidationAndRetryManager {
    bufLen: number = 10;
    retries: Array<Map<DBName, number>> = Array.from({length: this.bufLen}).map(_ => new Map());
    searchInvalidations: Array<boolean> = Array.from({length: this.bufLen}).map(_ => false);
    currentSearchIndex: number = 0;

    // Bump the counter, wait for the next search to start
    bump() {
        this.currentSearchIndex = mod(this.currentSearchIndex + 1, this.searchInvalidations.length);

        // Pre-allow the next index
        this.searchInvalidations[this.currentSearchIndex] = false;
        this.retries[this.currentSearchIndex] = new Map();
    }

    // Check if the named search can return results
    isInvalidated(searchID: number): boolean {
        return this.searchInvalidations[searchID];
    }

    // Invalidate the previous search
    invalidate() {
        const index = mod(this.currentSearchIndex - 1, this.searchInvalidations.length);
        this.searchInvalidations[index] = true;
    }

    // Check if the named DB can retry
    attemptRetry(dbName: DBName, searchID: number) {
        console.log("RETRY SEARCH ID", searchID);
        // TODO: implement
        const currentAttempt = this.retries[searchID];
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

}
