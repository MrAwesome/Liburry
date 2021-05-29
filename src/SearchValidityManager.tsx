import {RETRY_ATTEMPTS} from "./searchSettings";
import {DBName} from "./types";
import {mod} from "./utils";

export default class SearchInvalidationAndRetryManager {
    private bufLen: number = 10;
    private retries: Array<Map<DBName, number>> = Array.from({length: this.bufLen}).map(_ => new Map());
    private searchInvalidations: Array<boolean> = Array.from({length: this.bufLen}).map(_ => false);

    initialSearchID: number = 0;
    currentSearchID: number = this.initialSearchID;

    // Bump the counter, wait for the next search to start
    bump() {
        this.currentSearchID = mod(this.currentSearchID + 1, this.searchInvalidations.length);

        // Pre-allow the next index
        this.searchInvalidations[this.currentSearchID] = false;
        this.retries[this.currentSearchID] = new Map();
    }

    // Check if the named search can return results
    isInvalidated(searchID: number): boolean {
        return this.searchInvalidations[searchID];
    }

    // Invalidate the previous search
    invalidate() {
        const index = mod(this.currentSearchID - 1, this.searchInvalidations.length);
        this.searchInvalidations[index] = true;
    }

    // Check if the named DB can retry for the named searchID
    acquireRetry(dbName: DBName, searchID: number) {
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
