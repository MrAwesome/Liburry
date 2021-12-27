import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import {RETRY_ATTEMPTS} from "../../search/searchers/constants";
import {DBIdentifier} from "../../types/config";
import {mod} from "../../utils";

export class SearchContext {
    query: string = "";
    invalidated: boolean = false;
    retries: Map<DBIdentifier, number> = new Map();
    completionStatus: Map<DBIdentifier, boolean> = new Map();

    constructor(
        id: number,
        private expectedNumberOfDBs: number,
    ) {
    }

    clear() {
        this.query = "";
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

    getCompletedAndTotal(): [completed: number, total: number] {
        let totalDBs = this.expectedNumberOfDBs;
        let completedDBs = 0;
        this.completionStatus.forEach((done, _name) => {
            if (done) {
                completedDBs += 1;
            }
        });

        return [completedDBs, totalDBs];
    }
}

export default class SearchValidityManager {
    private bufLen: number = 10;
    private searches: Array<SearchContext>;
    private console: StubConsole;

    constructor(
        debug: boolean,
        expectedNumberOfDBs: number = 0,
    ) {
        this.console = getDebugConsole(debug);
        this.searches = Array.from({length: this.bufLen}).map((_, i) => new SearchContext(i, expectedNumberOfDBs));
    }

    initialSearchID: number = 0;
    currentSearchID: number = this.initialSearchID;

    getSearch(searchID: number): SearchContext {
        return this.searches[searchID];
    }

    getCurrentSearch(): SearchContext {
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
        this.console.timeEnd(`search-${index}`);
    }

    // Check if the named DB can retry for the named searchID
    acquireRetry(dbIdentifier: DBIdentifier, searchID: number): boolean {
        const currentAttempt = this.getSearch(searchID).retries;
        const retries = currentAttempt.get(dbIdentifier);
        if (retries === undefined) {
            currentAttempt.set(dbIdentifier, RETRY_ATTEMPTS - 1);
            return true;
        } else {
            if (retries > 0) {
                currentAttempt.set(dbIdentifier, retries - 1);
                return true;
            } else {
                return false;
            }
        }
    }

    retriesRemaining(dbIdentifier: DBIdentifier, searchID: number): number {
        const currentAttempt = this.getSearch(searchID).retries;
        const retries = currentAttempt.get(dbIdentifier);
        return retries ?? RETRY_ATTEMPTS;
    }

    checkAllSearchesCompleted(searchID: number): boolean {
        const completions = this.getSearch(searchID).completionStatus;

        // This odd-looking construction exists because:
        // 1) We want to bail early, so we can't use Map.forEach
        // 2) eslint won't play ball on using an underscore to ignore a var here
        for (const kv of completions) {
            const isCompleted = kv[1];
            if (!isCompleted) {
                return false;
            }
        }
        return true;
    }

    // NOTE: could check here if search was already started, but as long
    //       as we're always clearing it shouldn't be a problem
    startSearches(searchID: number, query: string, dbIdentifiers: DBIdentifier[]) {
        const searchContext = this.getSearch(searchID);
        searchContext.query = query;

        this.console.time(`search-${this.currentSearchID}`);
        dbIdentifiers.forEach((dbIdentifier) => this.getCurrentSearch().completionStatus.set(dbIdentifier, false))
    }

    markSearchCompleted(dbIdentifier: DBIdentifier, searchID: number) {
        this.getSearch(searchID).completionStatus.set(dbIdentifier, true)

        if (this.checkAllSearchesCompleted(searchID)) {
            this.console.timeEnd(`search-${searchID}`);

            const query = this.getSearch(searchID).query;
            this.console.log(`"Search "${query}"(${searchID}) finished successfully. Slowest DB: "${dbIdentifier}"`);
        }
    }
}
