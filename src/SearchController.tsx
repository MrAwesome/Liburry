import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

// TODO: check workers
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
        addResultsCallback: (results: PerDictResults) => Promise<void>,
        addDBLoadedCallback: (dbName: DBName) => Promise<void>,
        checkIfAllDBLoadedCallback: () => boolean,
        getCurrentQueryCallback: () => string,
        clearResultsCallback: () => Promise<void>,
    ) {
        this.console = getDebugConsole(debug);
        this.searchWorkerManager = new SearchWorkerManager(debug);
        this.validity = new SearchValidityManager();

        this.addResultsCallback = addResultsCallback;
        this.addDBLoadedCallback = addDBLoadedCallback;
        this.checkIfAllDBLoadedCallback = checkIfAllDBLoadedCallback;
        this.getCurrentQueryCallback = getCurrentQueryCallback;
        this.clearResultsCallback = clearResultsCallback;

        this.search = this.search.bind(this);
        this.searchWorkerReplyHandler = this.searchWorkerReplyHandler.bind(this);
        this.startWorkersAndListener = this.startWorkersAndListener.bind(this);
    }

    async startWorkersAndListener(searcherType: SearcherType) {
        this.searchWorkerManager.init(searcherType, this.searchWorkerReplyHandler);
    }

    async search(query: string) {
        // Invalidate the previous search, so any lingering results don't pollute the current view
        this.validity.invalidate();

        if (query === "") {
            this.searchWorkerManager.cancelAllCurrent();
            this.clearResultsCallback();
        } else {
            this.searchWorkerManager.searchAll(query, this.validity.currentSearchID);
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
                this.console.time("searchRender-" + dbName);

                const wasInvalidated = this.validity.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.addResultsCallback(results);
                }
                this.console.timeEnd("searchRender-" + dbName);
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

                // There is a small mild condition here where typing before DB load
                // can mean a search for the same string can be interrupted. It would
                // already be invalidated, so there's not really any harm besides wasted cycles.
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
