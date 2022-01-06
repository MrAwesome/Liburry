import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import SearchWorkerManager from "./SearchWorkerManager";
import SearchValidityManager, {SearchContext} from "./SearchValidityManager";
import {AllDBLoadStats, AnnotatedPerDictResults, annotateRawResults, LoadedDBsMap, PerDictResultsRaw, SingleDBLoadStatus} from "../../types/dbTypes";
import {SearcherType} from "../../search/searchers/Searcher";
import {DBConfig, DBIdentifier} from "../../types/config";
import type AppConfig from "../../configHandler/AppConfig";

// TODO: write tests for this, which ensure the correct messages are sent and callbacks are called

interface SearchControllerArgs {
    debug: boolean,
    getNewestQuery: () => string,
    appConfig: AppConfig,
    genAddResultsCallback: (results: AnnotatedPerDictResults) => Promise<void>
    genClearResultsCallback: () => Promise<void>
    genUpdateDisplayForDBLoadEvent?: (dbStats: AllDBLoadStats | {didReload: true}) => Promise<void>,
    genUpdateDisplayForSearchEvent?: (searchContext: SearchContext | null) => Promise<void>,
}

export default class SearchController {
    private searchWorkerManager: SearchWorkerManager;
    private validity: SearchValidityManager;
    private console: StubConsole;
    private loadedDBs: LoadedDBsMap;

    constructor(
        private r: SearchControllerArgs,
    ) {
        const initialDBLoadedMapping: [DBIdentifier, SingleDBLoadStatus][] =
            this.r.appConfig.dbConfigHandler.getAllEnabledDBConfigs().map((k: DBConfig) => [
                k.getDBIdentifier(),
                {
                    isDownloaded: false,
                    isParsed: false,
                    isLoaded: false,
                }
            ]);

        this.loadedDBs = new LoadedDBsMap(initialDBLoadedMapping);
        const expectedNumberOfDBs = Array.from(this.loadedDBs.keys()).length;
        this.console = getDebugConsole(this.r.debug);
        // NOTE: when changing subapp, you'll need to re-create searchworkermanager since it gets subapp through appconfig... either that, or change subapp in appconfig directly, and deal with the consequences of that. should this entire component be re-created?
        this.searchWorkerManager = new SearchWorkerManager(this.r.appConfig, this.r.debug);
        this.validity = new SearchValidityManager(this.r.debug, expectedNumberOfDBs);

        // Callbacks for the search controller to use to communicate changes back to the main component.
        this.addResults = this.addResults.bind(this);
        this.clearResultsCallback = this.clearResultsCallback.bind(this);
        this.dbLoadStateUpdateCallback = this.dbLoadStateUpdateCallback.bind(this);
        this.getCurrentQueryCallback = this.getCurrentQueryCallback.bind(this);
        this.checkIfAllDBLoadedCallback = this.checkIfAllDBLoadedCallback.bind(this);

        this.search = this.search.bind(this);
        this.searchWorkerReplyHandler = this.searchWorkerReplyHandler.bind(this);
        this.startWorkersAndListener = this.startWorkersAndListener.bind(this);

    }

    async addResults(rawResults: PerDictResultsRaw) {
        // NOTE: this is where results are annotated with metadata about each column.
        //       if this becomes computationally significant, the work can be moved
        //       to its own thread (as can the entire controller, for that matter)
        const resultsRaw = annotateRawResults(rawResults, this.r.appConfig);
        const results = new AnnotatedPerDictResults(resultsRaw);

        this.r.genAddResultsCallback(results);
    }

    async clearResultsCallback() {
        this.r.genClearResultsCallback();
    }

    async dbLoadStateUpdateCallback(dbIdentifier: DBIdentifier, stateDelta: Partial<SingleDBLoadStatus>) {
        this.loadedDBs.setLoadState(dbIdentifier, stateDelta);
        this.r.genUpdateDisplayForDBLoadEvent?.(this.loadedDBs.getLoadStats());
    }

    checkIfAllDBLoadedCallback(): boolean {
        return Array.from(this.loadedDBs.values()).every(x => x);
    }

    getCurrentQueryCallback(): string {
        return this.r.getNewestQuery();
    }

    async startWorkersAndListener(searcherType: SearcherType) {
        this.searchWorkerManager.init(searcherType, this.searchWorkerReplyHandler);
    }

    async cleanup() {
        this.clearResultsCallback();
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
            this.r.genUpdateDisplayForSearchEvent?.(null);
        } else {
            const activeDBs = this.searchWorkerManager.getIdentifiersForAllActiveDBs();
            this.validity.startSearches(searchID, query, activeDBs);
            this.searchWorkerManager.searchAll(query, searchID);
            this.validity.bump();
            this.r.genUpdateDisplayForSearchEvent?.(searchContext);
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
                    this.r.genUpdateDisplayForSearchEvent?.(this.validity.getSearch(searchID));
                }
            }
                break;
            case SearchWorkerResponseType.SEARCH_SUCCESS: {
                const {results, dbIdentifier, searchID} = message.payload;

                const wasInvalidated = this.validity.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.addResults(results);
                    this.validity.markSearchCompleted(dbIdentifier, searchID);
                    this.r.genUpdateDisplayForSearchEvent?.(this.validity.getSearch(searchID));
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

                    this.r.genUpdateDisplayForSearchEvent?.(this.validity.getSearch(searchID));
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
