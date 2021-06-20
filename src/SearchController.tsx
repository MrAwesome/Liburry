import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

import getDebugConsole, {StubConsole} from "./getDebugConsole";
import SearchWorkerManager from "./SearchWorkerManager";
import SearchValidityManager from "./SearchValidityManager";
import {DBName, PerDictResults} from "./types/dbTypes";
import {SearcherType} from "./search";
import {GetMainState, SetMainState} from "./types/mainAppState";

// TODO: write tests for this, which ensure the correct messages are sent and callbacks are called

export default class SearchController {
    private searchWorkerManager: SearchWorkerManager;
    private validity: SearchValidityManager;
    private console: StubConsole;

    getStateTyped: GetMainState;
    setStateTyped: SetMainState;

    constructor(
        debug: boolean,
        getStateTyped: GetMainState,
        setStateTyped: SetMainState,
    ) {
        this.console = getDebugConsole(debug);
        this.searchWorkerManager = new SearchWorkerManager(debug);
        this.validity = new SearchValidityManager(debug);

        this.getStateTyped = getStateTyped;
        this.setStateTyped = setStateTyped;

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

    async addResultsCallback(results: PerDictResults) {
        this.setStateTyped((state) => state.resultsHolder.addResults(results));
    }

    async addDBLoadedCallback(dbName: DBName) {
        this.setStateTyped((state) => state.loadedDBs.set(dbName, true));
    }

    async clearResultsCallback() {
        this.setStateTyped((state) => state.resultsHolder.clear());
    }

    checkIfAllDBLoadedCallback(): boolean {
        return Array.from(this.getStateTyped().loadedDBs.values()).every(x => x);
    }

    getCurrentQueryCallback(): string {
        return this.getStateTyped().options.query;
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
            const activeDBs = this.searchWorkerManager.getAllActiveDBs();
            const searchID = this.validity.currentSearchID;
            this.validity.startSearches(query, activeDBs);
            this.searchWorkerManager.searchAll(query, searchID);
            this.validity.bump();
        }
    }

    async searchWorkerReplyHandler(messageEvent: MessageEvent<SearchWorkerResponseMessage>) {
        const message = messageEvent.data;
        switch (message.resultType) {
            case SearchWorkerResponseType.CANCELED: {
                let {query, dbName, searchID} = message.payload;
                this.console.log(`Canceled search "${query}" with searchID "${searchID}" on db "${dbName}".`);
            }
                break;
            case SearchWorkerResponseType.SEARCH_SUCCESS: {
                let {results, dbName, searchID} = message.payload;

                const wasInvalidated = this.validity.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.addResultsCallback(results);
                    this.validity.markSearchCompleted(dbName, searchID);
                }

            }
                break;
            case SearchWorkerResponseType.SEARCH_FAILURE: {
                let {query, dbName, searchID, failure} = message.payload;

                // TODO: use a brief setTimeout here?
                // TODO: can these even be invalidated?
                if (!this.validity.isInvalidated(searchID)) {
                    const msg = `Encountered a failure "${failure}" while searching "${dbName}" for "${query}". `;
                    if (this.validity.acquireRetry(dbName, searchID)) {
                        this.searchWorkerManager.searchSpecificDB(dbName, query, searchID);
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
                let {dbName} = message.payload;
                this.console.time("dbLoadRender-" + dbName);
                this.addDBLoadedCallback(dbName);
                this.console.timeEnd("dbLoadRender-" + dbName);
                const query = this.getCurrentQueryCallback();

                // There is a small mild race condition here where typing before DB load
                // can mean a search for the same string can be interrupted. It would
                // already be invalidated, so there's not really any harm besides wasted cycles.
                //
                // TODO: Add to validity.searchCompletionStatus here
                const initialID = this.validity.initialSearchID;
                if (query && !this.validity.isInvalidated(initialID)) {
                    this.searchWorkerManager.searchSpecificDB(dbName, query, initialID);
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
