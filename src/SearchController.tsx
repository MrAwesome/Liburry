import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

import getDebugConsole, {StubConsole} from "./getDebugConsole";
import SearchWorkerManager from "./SearchWorkerManager";
import SearchValidityManager from "./SearchValidityManager";
import {DBName, PerDictResults} from "./types/dbTypes";
import {SearcherType} from "./search";

export default class SearchController {
    private searchWorkerManager: SearchWorkerManager;
    private validity: SearchValidityManager;
    private console: StubConsole;

    addResultsCallback: (results: PerDictResults) => Promise<void>;
    addDBLoadedCallback: (dbName: DBName) => Promise<void>;
    checkIfAllDBLoadedCallback: () => boolean;
    getCurrentQueryCallback: () => string;
    clearResultsCallback: () => Promise<void>;

    constructor(
        debug: boolean,
        callbacks: {
            addResultsCallback: (results: PerDictResults) => Promise<void>,
            addDBLoadedCallback: (dbName: DBName) => Promise<void>,
            clearResultsCallback: () => Promise<void>,
            checkIfAllDBLoadedCallback: () => boolean,
            getCurrentQueryCallback: () => string,
        }
    ) {
        this.console = getDebugConsole(debug);
        this.searchWorkerManager = new SearchWorkerManager(debug);
        this.validity = new SearchValidityManager(debug);

        this.addResultsCallback = callbacks.addResultsCallback;
        this.addDBLoadedCallback = callbacks.addDBLoadedCallback;
        this.checkIfAllDBLoadedCallback = callbacks.checkIfAllDBLoadedCallback;
        this.getCurrentQueryCallback = callbacks.getCurrentQueryCallback;
        this.clearResultsCallback = callbacks.clearResultsCallback;

        this.search = this.search.bind(this);
        this.searchWorkerReplyHandler = this.searchWorkerReplyHandler.bind(this);
        this.startWorkersAndListener = this.startWorkersAndListener.bind(this);
    }

    async startWorkersAndListener(searcherType: SearcherType) {
        this.searchWorkerManager.init(searcherType, this.searchWorkerReplyHandler);
    }

    async handleUnmount() {
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
            this.validity.startSearches(activeDBs);
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
                let {results, dbName, searchID, query} = message.payload;

                const wasInvalidated = this.validity.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.addResultsCallback(results);
                    this.validity.markSearchCompleted(dbName, searchID);
                    if (this.validity.checkAllSearchesCompleted(searchID)) {
                        this.console.log(`Search "${searchID}"/"${query}" finished successfully. Slowest DB: "${dbName}"`);
                    }
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
                    this.console.timeEnd("initToAllDB");
                }
            }
                break;
            default:
                console.warn("Received unknown message from search worker!", messageEvent);
        }
    }
}
