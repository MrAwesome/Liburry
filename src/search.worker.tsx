import getDebugConsole, {StubConsole} from "./getDebugConsole";
import type {LangDB, DBShortName, PerDictResultsRaw} from "./types/dbTypes";
import {getSearcher, OngoingSearch, Searcher, SearcherType, SearchFailure} from "./search";

// TODO(wishlist): ensure that objects passed to/from the worker are simple objects (interface, not class)
//                 and/or translate from simple objects to full classes (with methods) before/after message

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

export type SearchWorkerCommandMessage =
    {command: SearchWorkerCommandType.INIT, payload: {dbName: DBShortName, langDB: LangDB, debug: boolean, searcherType: SearcherType}} |
    {command: SearchWorkerCommandType.SEARCH, payload: {query: string, searchID: number}} |
    {command: SearchWorkerCommandType.CANCEL, payload?: null} |
    {command: SearchWorkerCommandType.LOG, payload?: null} |
    {command: SearchWorkerCommandType.CHANGE_SEARCHER, payload: {searcherType: SearcherType}};

export type SearchSuccessPayload = {dbName: DBShortName, query: string, results: PerDictResultsRaw, searchID: number};
export type SearchWorkerResponseMessage =
    {resultType: SearchWorkerResponseType.CANCELED, payload: {dbName: DBShortName, query: string, searchID: number}} |
    {resultType: SearchWorkerResponseType.SEARCH_SUCCESS, payload: SearchSuccessPayload} |
    {resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {dbName: DBShortName, query: string, searchID: number, failure: SearchFailure}} |
    {resultType: SearchWorkerResponseType.DB_LOAD_SUCCESS, payload: {dbName: DBShortName}};

type WorkerInitializedState =
    {init: WorkerInitState.UNINITIALIZED} |
    {init: WorkerInitState.FAILED_TO_PREPARE, dbName: DBShortName, langDB: LangDB} |
    {init: WorkerInitState.LOADING, dbName: DBShortName, langDB: LangDB, searcher: Searcher} |
    {init: WorkerInitState.LOADED, dbName: DBShortName, langDB: LangDB, searcher: Searcher} |
    {init: WorkerInitState.SEARCHING, dbName: DBShortName, langDB: LangDB, searcher: Searcher, ogs: OngoingSearch, searchID: number};

enum WorkerInitState {
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
}

export enum SearchWorkerResponseType {
    CANCELED = "CANCELED",
    DB_LOAD_SUCCESS = "DB_LOAD_SUCCESS",
    SEARCH_FAILURE = "SEARCH_FAILURE",
    SEARCH_SUCCESS = "SEARCH_SUCCESS",
}

function isResults(results: any): results is PerDictResultsRaw {
    return 'results' in results;
}

class SearchWorkerHelper {
    state: WorkerInitializedState = {init: WorkerInitState.UNINITIALIZED};
    debug: boolean = false;
    console: StubConsole = getDebugConsole(false);

    private sendResponse(message: SearchWorkerResponseMessage) {
        if (this.state.init !== WorkerInitState.UNINITIALIZED) {
            const {dbName} = this.state;
            this.console.log("Sending response from:", dbName, message);
        } else {
            this.console.log("Sending response from uninitialized worker:", message);
        }

        ctx.postMessage(message);
    }

    start(dbName: DBShortName, langDB: LangDB, debug: boolean, searcherType: SearcherType) {
        this.debug = debug;
        this.console = getDebugConsole(debug);
        const searcher = getSearcher(searcherType, dbName, langDB, this.debug);
        this.state = {dbName, langDB, searcher, init: WorkerInitState.LOADING};

        searcher.prepare().then(() => {
            this.state = {searcher, dbName, langDB, init: WorkerInitState.LOADED};
            this.sendResponse({resultType: SearchWorkerResponseType.DB_LOAD_SUCCESS, payload: {dbName}});
        }).catch((err) => {
            console.warn("DB preparation failure!", this, err);
            this.state = {dbName, langDB, init: WorkerInitState.FAILED_TO_PREPARE};
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
                const dbName = this.state.dbName;
                if (ongoingSearch instanceof OngoingSearch) {
                    const originalState = this.state;
                    this.state = {...originalState, init: WorkerInitState.SEARCHING, ogs: ongoingSearch, searchID};
                    ongoingSearch.parsePromise?.then((resultsOrFailure) => {
                        if (isResults(resultsOrFailure)) {
                            this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_SUCCESS, payload: {query, results: resultsOrFailure, dbName, searchID}});
                        } else {
                            this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {query, dbName, searchID, failure: resultsOrFailure}});
                        }
                        this.state = originalState;
                    });
                } else {
                    this.console.log("Failed searching!", ongoingSearch, this);
                    this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {query, dbName, searchID, failure: ongoingSearch}});
                }
                break;
            case WorkerInitState.UNINITIALIZED:
                this.log();
                console.error("Attempted to search uninitialized DB!")
        }

    }

    cancel() {
        if (this.state.init === WorkerInitState.SEARCHING) {
            const {ogs, dbName, searchID} = this.state;
            const {query} = ogs;
            ogs.cancel();
            this.sendResponse({resultType: SearchWorkerResponseType.CANCELED, payload: {query, dbName, searchID}});
            this.state = {...this.state, init: WorkerInitState.LOADED};
        }
    }

    changeSearcher(searcherType: SearcherType) {
        if (this.state.init !== WorkerInitState.UNINITIALIZED) {
            const {dbName, langDB} = this.state;

            this.cancel();
            sw.start(dbName, langDB, this.debug, searcherType);
        }
    }

    log() {
        this.console.log(this);
    }
}

// TODO: move types to d.ts, import type
let sw: SearchWorkerHelper = new SearchWorkerHelper();

// Respond to message from parent thread
ctx.addEventListener("message", (e) => {
    const message: SearchWorkerCommandMessage = e.data;
    switch (message.command) {
        case SearchWorkerCommandType.INIT: {
            const {dbName, langDB, debug, searcherType} = message.payload;
            sw.start(dbName, langDB, debug, searcherType);
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
    }
});

export default null as any;
