import {SearchSuccessPayload, SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

import getDebugConsole, {StubConsole} from "./getDebugConsole";
import SearchWorkerManager from "./SearchWorkerManager";
import SearchValidityManager from "./SearchValidityManager";
import {AnnotatedPerDictResults, annotateRawResults, PerDictResultsRaw} from "./types/dbTypes";
import {SearcherType} from "./search";
import {GetMainState, SetMainState} from "./ChhaTaigi";
import {AppConfig, DBIdentifier} from "./types/config";

// TODO: write tests for this, which ensure the correct messages are sent and callbacks are called

export default class SearchController {
    private searchWorkerManager: SearchWorkerManager;
    private validity: SearchValidityManager;
    private console: StubConsole;

    constructor(
        debug: boolean,
        private getStateTyped: GetMainState,
        private setStateTyped: SetMainState,
        private getNewestQuery: () => string,
        private appConfig: AppConfig,
    ) {
        this.console = getDebugConsole(debug);
        this.searchWorkerManager = new SearchWorkerManager(appConfig, debug);
        this.validity = new SearchValidityManager(debug);

        // Callbacks for the search controller to use to communicate changes back to the main component.
        this.addResultsCallback = this.addResultsCallback.bind(this);
        this.addDBLoadedCallback = this.addDBLoadedCallback.bind(this);
        this.getCurrentQueryCallback = this.getCurrentQueryCallback.bind(this);
        this.checkIfAllDBLoadedCallback = this.checkIfAllDBLoadedCallback.bind(this);
        this.clearResultsCallback = this.clearResultsCallback.bind(this);

        this.search = this.search.bind(this);
        this.searchWorkerReplyHandler = this.searchWorkerReplyHandler.bind(this);
        this.startWorkersAndListener = this.startWorkersAndListener.bind(this);
    }

    async addResultsCallback(rawResults: PerDictResultsRaw) {
        // NOTE: this is where results are annotated with metadata about each column.
        //       if this becomes computationally significant, the work can be moved
        //       to its own thread (as can the entire controller, for that matter)
        const resultsRaw = annotateRawResults(rawResults, this.appConfig);
        const results = new AnnotatedPerDictResults(resultsRaw);

        this.setStateTyped((state) => state.resultsHolder.addResults(results));
    }

    async addDBLoadedCallback(dbIdentifier: DBIdentifier) {
        this.setStateTyped((state) => state.loadedDBs.set(dbIdentifier, true));
    }

    async clearResultsCallback() {
        this.setStateTyped((state) => state.resultsHolder.clear());
    }

    checkIfAllDBLoadedCallback(): boolean {
        return Array.from(this.getStateTyped().loadedDBs.values()).every(x => x);
    }

    getCurrentQueryCallback(): string {
        return this.getNewestQuery();
    }

    async startWorkersAndListener(searcherType: SearcherType) {
        this.searchWorkerManager.init(searcherType, this.searchWorkerReplyHandler);
    }

    async cleanup() {
        this.searchWorkerManager.stopAll();
    }

    async search(query: string) {
        // Invalidate the previous search, so any lingering results don't pollute the current view
        this.validity.invalidate();

        if (query === "") {
            this.searchWorkerManager.cancelAllCurrent();
            this.clearResultsCallback();
        } else {
            const activeDBs = this.searchWorkerManager.getIdentifiersForAllActiveDBs();
            const searchID = this.validity.currentSearchID;
            this.validity.startSearches(query, activeDBs);
            this.searchWorkerManager.searchAll(query, searchID);
            this.validity.bump();
        }
    }

    doSearch(payload: SearchSuccessPayload) {
        const {results, dbIdentifier, searchID} = payload;

        const wasInvalidated = this.validity.isInvalidated(searchID);
        if (!wasInvalidated) {
            this.addResultsCallback(results);
            this.validity.markSearchCompleted(dbIdentifier, searchID);
        }
    }

    async searchWorkerReplyHandler(messageEvent: MessageEvent<SearchWorkerResponseMessage>) {
        const message = messageEvent.data;
        switch (message.resultType) {
            case SearchWorkerResponseType.CANCELED: {
                const {query, dbIdentifier, searchID} = message.payload;
                this.console.log(`Canceled search "${query}" with searchID "${searchID}" on db "${dbIdentifier}".`);
            }
                break;
            case SearchWorkerResponseType.SEARCH_SUCCESS: {
                this.doSearch(message.payload);
            }
                break;
            case SearchWorkerResponseType.SEARCH_FAILURE: {
                const {query, dbIdentifier, searchID, failure} = message.payload;

                // TODO: use a brief setTimeout here?
                // TODO: can these even be invalidated?
                if (!this.validity.isInvalidated(searchID)) {
                    const msg = `Encountered a failure "${failure}" while searching "${dbIdentifier}" for "${query}". `;
                    if (this.validity.acquireRetry(dbIdentifier, searchID)) {
                        this.searchWorkerManager.searchSpecificDB(dbIdentifier, query, searchID);
                        console.warn(msg + "Trying again...");
                    } else {
                        console.error(msg + "Ran out of retries!");
                    }
                } else {
                    this.console.log("Requested to retry an invalidated search: ", message.payload);
                }
            }
                break;
            case SearchWorkerResponseType.DB_LOAD_SUCCESS: {
                const {dbIdentifier} = message.payload;
                this.console.time("dbLoadRender-" + dbIdentifier);
                this.addDBLoadedCallback(dbIdentifier);
                this.console.timeEnd("dbLoadRender-" + dbIdentifier);
                const query = this.getCurrentQueryCallback();

                // There is a small mild race condition here where typing before DB load
                // can mean a search for the same string can be interrupted. It would
                // already be invalidated, so there's not really any harm besides wasted cycles.
                //
                // TODO: Add to validity.searchCompletionStatus here
                const initialID = this.validity.initialSearchID;
                if (query && !this.validity.isInvalidated(initialID)) {
                    this.searchWorkerManager.searchSpecificDB(dbIdentifier, query, initialID);
                }

                if (this.checkIfAllDBLoadedCallback()) {
                    this.console.log("All databases loaded!");
                    this.console.timeEnd("mountToAllDB");
                }
            }
                break;
            default:
                console.warn("Received unknown message from search worker!", messageEvent);
        }
    }
}
