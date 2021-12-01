import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

import getDebugConsole, {StubConsole} from "./getDebugConsole";
import SearchWorkerManager from "./SearchWorkerManager";
import SearchValidityManager, {SearchContext} from "./SearchValidityManager";
import {AllDBLoadStats, AnnotatedPerDictResults, annotateRawResults, PerDictResultsRaw, SingleDBLoadStatus} from "./types/dbTypes";
import {SearcherType} from "./search";
import {GetMainState, SetMainState} from "./ChhaTaigi";
import {DBIdentifier} from "./types/config";
import type AppConfig from "./configHandler/AppConfig";

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
        //private getCurrentMountAttempt: () => number,
        private appConfig: AppConfig,
        private updateDisplayForDBLoadEvent?: (dbStats: AllDBLoadStats) => void,
        private updateDisplayForSearchEvent?: (searchContext: SearchContext | null) => void,
    ) {
        const expectedNumberOfDBs = Array.from(this.getStateTyped().loadedDBs.keys()).length;
        this.console = getDebugConsole(debug);
        // NOTE: when changing subapp, you'll need to re-create searchworkermanager since it gets subapp through appconfig... either that, or change subapp in appconfig directly, and deal with the consequences of that. should this entire component be re-created?
        this.searchWorkerManager = new SearchWorkerManager(appConfig, debug);
        this.validity = new SearchValidityManager(debug, expectedNumberOfDBs);

        // Callbacks for the search controller to use to communicate changes back to the main component.
        this.addResultsCallback = this.addResultsCallback.bind(this);
        this.dbLoadStateUpdateCallback = this.dbLoadStateUpdateCallback.bind(this);
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

    async dbLoadStateUpdateCallback(dbIdentifier: DBIdentifier, stateDelta: Partial<SingleDBLoadStatus>) {
        this.setStateTyped((state) => {
            state.loadedDBs.setLoadState(dbIdentifier, stateDelta);
            this.updateDisplayForDBLoadEvent?.(state.loadedDBs.getLoadStats());
        });
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

        const searchContext = this.validity.getCurrentSearch();
        const searchID = this.validity.currentSearchID;

        if (query === "") {
            this.searchWorkerManager.cancelAllCurrent();
            this.clearResultsCallback();
            this.updateDisplayForSearchEvent?.(null);
        } else {
            const activeDBs = this.searchWorkerManager.getIdentifiersForAllActiveDBs();
            this.validity.startSearches(searchID, query, activeDBs);
            this.searchWorkerManager.searchAll(query, searchID);
            this.validity.bump();
            this.updateDisplayForSearchEvent?.(searchContext);
        }
    }

    async searchWorkerReplyHandler(messageEvent: MessageEvent<SearchWorkerResponseMessage>) {
        const message = messageEvent.data;
        switch (message.resultType) {
            case SearchWorkerResponseType.CANCELED: {
                const {query, dbIdentifier, searchID} = message.payload;
                this.console.log(`Canceled search "${query}" with searchID "${searchID}" on db "${dbIdentifier}".`);

                const wasInvalidated = this.validity.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.updateDisplayForSearchEvent?.(this.validity.getSearch(searchID));
                }
            }
                break;
            case SearchWorkerResponseType.SEARCH_SUCCESS: {
                const {results, dbIdentifier, searchID} = message.payload;

                const wasInvalidated = this.validity.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.addResultsCallback(results);
                    this.validity.markSearchCompleted(dbIdentifier, searchID);
                    this.updateDisplayForSearchEvent?.(this.validity.getSearch(searchID));
                }
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

                    this.updateDisplayForSearchEvent?.(this.validity.getSearch(searchID));
                } else {
                    this.console.log("Requested to retry an invalidated search: ", message.payload);
                }
            }
                break;
            case SearchWorkerResponseType.DB_LOAD_STATUS_UPDATE: {
                const {dbIdentifier, stateDelta} = message.payload;
                this.console.time("dbLoadRender-" + dbIdentifier);
                this.dbLoadStateUpdateCallback(dbIdentifier, stateDelta);
                this.console.timeEnd("dbLoadRender-" + dbIdentifier);

                // The DB is fully loaded/prepared and ready to handle searches.
                if (stateDelta.isLoaded) {
                    const query = this.getCurrentQueryCallback();

                    // There is a small mild race condition here where typing before DB load
                    // can mean a search for the same string can be interrupted. It would
                    // already be invalidated, so there's not really any harm besides wasted cycles.
                    //
                    // TODO: Add to validity.searchCompletionStatus here
                    const initialID = this.validity.initialSearchID;
                    if (query && !this.validity.isInvalidated(initialID)) {
                        this.validity.startSearches(initialID, query, [dbIdentifier]);
                        this.searchWorkerManager.searchSpecificDB(dbIdentifier, query, initialID);
                    }

                    if (this.checkIfAllDBLoadedCallback()) {
                        this.console.log("All databases loaded!");
                        this.console.timeEnd("mountToAllDB");
                    }
                }
            }
                break;
            default:
                console.warn("Received unknown message from search worker!", messageEvent);
        }
    }
}
