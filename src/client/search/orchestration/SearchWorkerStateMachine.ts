import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import type {PerDictResultsRaw, SingleDBLoadStatus} from "../../types/dbTypes";
import {getSearcherPreparer, OngoingSearch, Searcher, SearcherPreparer, SearcherType, SearchFailure} from "../../search/searchers/Searcher";
import {DBIdentifier} from "../../configHandler/zodConfigTypes";
import DBConfig from "../../configHandler/DBConfig";

// NOTE: RawDBConfig is used here because we're passing between workers, and anything higher-level would lose its methods during serialization.
import {RawDBConfig, ViewID} from "../../configHandler/zodConfigTypes";

// TODO(wishlist): ensure that objects passed to/from the worker are simple objects (interface, not class)
//                 and/or translate from simple objects to full classes (with methods) before/after message

export type SearchWorkerCommandMessage =
    {command: SearchWorkerCommandType.INIT, payload: {dbIdentifier: DBIdentifier, rawDBConfig: RawDBConfig, viewID: ViewID | null | undefined, debug: boolean, searcherType: SearcherType}} |
    {command: SearchWorkerCommandType.SEARCH, payload: {query: string, searchID: number}} |
    {command: SearchWorkerCommandType.CANCEL, payload?: null} |
    {command: SearchWorkerCommandType.LOG, payload?: null} |
    {command: SearchWorkerCommandType.CHANGE_SEARCHER, payload: {searcherType: SearcherType}} |
    {command: SearchWorkerCommandType.TERMINATE, payload?: null};

export type SearchWorkerResponseMessage =
    {resultType: SearchWorkerResponseType.CANCELED, payload: {dbIdentifier: DBIdentifier, query: string, searchID: number}} |
    {resultType: SearchWorkerResponseType.SEARCH_SUCCESS, payload: {dbIdentifier: DBIdentifier, query: string, results: PerDictResultsRaw, searchID: number}} |
    {resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {dbIdentifier: DBIdentifier, query: string, searchID: number, failure: SearchFailure}} |
    {resultType: SearchWorkerResponseType.DB_LOAD_STATUS_UPDATE, payload: {dbIdentifier: DBIdentifier, stateDelta: Partial<SingleDBLoadStatus>}};

type WorkerInitializedState =
    {init: WorkerInitState.UNINITIALIZED} |
    {init: WorkerInitState.FAILED_TO_PREPARE, dbIdentifier: DBIdentifier, dbConfig: DBConfig} |
    {init: WorkerInitState.LOADING, dbIdentifier: DBIdentifier, dbConfig: DBConfig, preparer: SearcherPreparer} |
    {init: WorkerInitState.LOADED, dbIdentifier: DBIdentifier, dbConfig: DBConfig, searcher: Searcher} |
    {init: WorkerInitState.SEARCHING, dbIdentifier: DBIdentifier, dbConfig: DBConfig, searcher: Searcher, ogs: OngoingSearch, searchID: number};

export enum WorkerInitState {
    UNINITIALIZED = "UNINITIALIZED",
    LOADING = "LOADING",
    LOADED = "LOADED",
    SEARCHING = "SEARCHING",
    FAILED_TO_PREPARE = "FAILED_TO_PREPARE",
}

export enum SearchWorkerCommandType {
    INIT = "INIT",
    SEARCH = "SEARCH",
    CANCEL = "CANCEL",
    LOG = "LOG",
    CHANGE_SEARCHER = "CHANGE_SEARCHER",
    TERMINATE = "TERMINATE",
}


export enum SearchWorkerResponseType {
    CANCELED = "CANCELED",
    SEARCH_FAILURE = "SEARCH_FAILURE",
    SEARCH_SUCCESS = "SEARCH_SUCCESS",
    DB_LOAD_STATUS_UPDATE = "DB_LOAD_STATUS_UPDATE"
}

function isResults(results: any): results is PerDictResultsRaw {
    return (results as PerDictResultsRaw).results !== undefined;
}

export default class SearchWorkerStateMachine {
    public state: WorkerInitializedState = {init: WorkerInitState.UNINITIALIZED};
    debug: boolean = false;
    console: StubConsole = getDebugConsole(false);

    // For use in unit tests
    public mostRecentResultOrFailure?: SearchFailure | PerDictResultsRaw;

    constructor(private ctx: Worker | "TEST_MODE_NO_WORKER") {}

    // TODO: have this use a different method in jest, and unit test that
    private sendResponse(message: SearchWorkerResponseMessage) {
        if (this.state.init !== WorkerInitState.UNINITIALIZED) {
            const {dbIdentifier} = this.state;
            this.console.log("Sending response from:", dbIdentifier, message);
        } else {
            this.console.log("Sending response from uninitialized worker:", message);
        }

        const {ctx} = this;
        if (ctx !== "TEST_MODE_NO_WORKER") {
            ctx.postMessage(message);
        } else {
            //console.log("Not sending message: ", message);
        }
    }

    start(dbIdentifier: DBIdentifier, dbConfig: DBConfig, debug: boolean, searcherType: SearcherType) {
        this.debug = debug;
        this.console = getDebugConsole(debug);

        const sendLoadStateUpdate = (stateDelta: Partial<SingleDBLoadStatus>) => {
            this.sendResponse({resultType: SearchWorkerResponseType.DB_LOAD_STATUS_UPDATE, payload: {dbIdentifier, stateDelta}});
        };

        const preparer = getSearcherPreparer(searcherType, dbConfig, sendLoadStateUpdate, this.debug);
        this.state = {dbIdentifier, dbConfig, preparer, init: WorkerInitState.LOADING};

        preparer.prepare().then((searcher) => {
            sendLoadStateUpdate({isLoaded: true});
            this.state = {searcher, dbIdentifier, dbConfig, init: WorkerInitState.LOADED};
        }).catch((err) => {
            console.warn("DB preparation failure!", this, err);
            this.state = {dbIdentifier, dbConfig, init: WorkerInitState.FAILED_TO_PREPARE};
            throw err;
        });
    }

    search(query: string, searchID: number) {
        switch (this.state.init) {
            case WorkerInitState.SEARCHING:
                this.cancel();
                this.search(query, searchID);
                break;
            case WorkerInitState.LOADED:
                const ongoingSearch = this.state.searcher.search(query);
                const dbIdentifier = this.state.dbIdentifier;
                if (ongoingSearch instanceof OngoingSearch) {
                    const originalState = this.state;
                    this.state = {...originalState, init: WorkerInitState.SEARCHING, ogs: ongoingSearch, searchID};
                    ongoingSearch.parsePromise?.then((resultsOrFailure) => {
                        this.mostRecentResultOrFailure = resultsOrFailure;
                        if (isResults(resultsOrFailure)) {
                            this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_SUCCESS, payload: {query, results: resultsOrFailure, dbIdentifier, searchID}});
                        } else {
                            this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {query, dbIdentifier, searchID, failure: resultsOrFailure}});
                        }
                        this.state = originalState;
                    });
                } else {
                    this.console.log("Failed searching!", ongoingSearch, this);
                    this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {query, dbIdentifier, searchID, failure: ongoingSearch}});
                }
                break;
            case WorkerInitState.UNINITIALIZED:
                this.log();
                console.error("Attempted to search uninitialized DB!")
        }

    }

    cancel() {
        if (this.state.init === WorkerInitState.SEARCHING) {
            const {ogs, dbIdentifier, searchID} = this.state;
            const {query} = ogs;
            ogs.cancel();
            this.sendResponse({resultType: SearchWorkerResponseType.CANCELED, payload: {query, dbIdentifier, searchID}});
            this.state = {...this.state, init: WorkerInitState.LOADED};
        }
    }

    changeSearcher(searcherType: SearcherType) {
        if (this.state.init !== WorkerInitState.UNINITIALIZED) {
            const {dbIdentifier, dbConfig} = this.state;

            this.cancel();
            this.start(dbIdentifier, dbConfig, this.debug, searcherType);
        }
    }

    log() {
        this.console.log(this);
    }

    terminate() {
        if (this.ctx !== "TEST_MODE_NO_WORKER") {
            this.ctx.terminate();
        }
    }
}

export function getSearchWorkerMessageHandler(sw: SearchWorkerStateMachine) {
    return (e: MessageEvent<SearchWorkerCommandMessage>) => {
        const message = e.data;
        switch (message.command) {
            case SearchWorkerCommandType.INIT: {
                const {dbIdentifier, rawDBConfig, viewID, debug, searcherType} = message.payload;
                const dbConfig = new DBConfig(dbIdentifier, rawDBConfig, viewID);
                sw.start(dbIdentifier, dbConfig, debug, searcherType);
            }
                break;
            case SearchWorkerCommandType.SEARCH:
                const {query, searchID} = message.payload;
                sw.search(query, searchID);
                break;
            case SearchWorkerCommandType.CANCEL:
                sw.cancel();
                break;
            case SearchWorkerCommandType.LOG:
                sw.log();
                break;
            case SearchWorkerCommandType.CHANGE_SEARCHER:
                const {searcherType} = message.payload;
                sw.changeSearcher(searcherType);
                break;
            case SearchWorkerCommandType.TERMINATE:
                sw.terminate();
                break;
        }
    }
}
