import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

// TODO: check workers
import {getWorkerDebugConsole, StubConsole} from "./debug_console";
import SearchWorkerManager from "./SearchWorkerManager";
import SearchValidityManager from "./SearchValidityManager";
import {DBName, PerDictResults} from "./types";


export default class SearchController {
    // TODO: make these private
    searchWorkerManager: SearchWorkerManager;
    searchValidityManager: SearchValidityManager;
    console: StubConsole;
    currentQuery: string;

    constructor(debug: boolean, initialQuery: string) {
        this.searchWorkerManager = new SearchWorkerManager(debug);
        this.searchValidityManager = new SearchValidityManager();
        this.console = getWorkerDebugConsole(debug);
        this.currentQuery = initialQuery;
    }

    searchWorkerReplyHandlerPartial(
        addResultsCallback: (results: PerDictResults) => Promise<void>,
        addDBLoadedCallback: (dbName: DBName) => Promise<void>,
        checkIfAllLoaded: () => boolean,
    ) {
        return async (messageEvent: MessageEvent<SearchWorkerResponseMessage>) => {
            this.handleSearchWorkerReply(messageEvent, addResultsCallback, addDBLoadedCallback, checkIfAllLoaded);
        }
    }

    async handleSearchWorkerReply(
        messageEvent: MessageEvent<SearchWorkerResponseMessage>,
        addResultsCallback: (results: PerDictResults) => Promise<void>,
        addDBLoadedCallback: (dbName: DBName) => Promise<void>,
        checkIfAllLoaded: () => boolean,
    ) {
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

                const wasInvalidated = this.searchValidityManager.isInvalidated(searchID);
                if (!wasInvalidated) {
                    // XXX;
                    addResultsCallback(results);
                }
                this.console.timeEnd("searchRender-" + dbName);
            }
                break;
            case SearchWorkerResponseType.SEARCH_FAILURE: {
                let {query, dbName, searchID, failure} = message.payload;

                // TODO: use a brief setTimeout here?
                const msg = `Encountered a failure "${failure}" while searching "${dbName}" for "${query}". `;
                if (this.searchValidityManager.attemptRetry(dbName, searchID)) {
                    this.searchWorkerManager.searchSpecificDB(dbName, query, searchID);
                    console.warn(msg + "Trying again...");
                } else {
                    console.error(msg + "Ran out of retries!");
                }
            }
                break;
            case SearchWorkerResponseType.DB_LOAD_SUCCESS: {
                let {dbName} = message.payload;
                this.console.time("dbLoadRender-" + dbName);
                addDBLoadedCallback(dbName);
                this.console.timeEnd("dbLoadRender-" + dbName);

                if (this.currentQuery) {
                    this.searchWorkerManager.searchSpecificDB(dbName, this.currentQuery, this.searchValidityManager.currentSearchIndex);
                    this.searchValidityManager.bump();
                }

                if (checkIfAllLoaded()) {
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
