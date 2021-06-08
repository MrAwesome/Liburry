import getDebugConsole, {StubConsole} from "./getDebugConsole";
import type {LangDB, DBName, PerDictResults} from "./types/dbTypes";
import {getSearcher, OngoingSearch, Searcher, SearcherType, SearchFailure} from "./search";

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

export type SearchWorkerCommandMessage =
    {command: SearchWorkerCommandType.INIT, payload: {dbName: DBName, langDB: LangDB, debug: boolean, searcherType: SearcherType}} |
    {command: SearchWorkerCommandType.SEARCH, payload: {query: string, searchID: number}} |
    {command: SearchWorkerCommandType.CANCEL, payload?: null} |
    {command: SearchWorkerCommandType.LOG, payload?: null} |
    {command: SearchWorkerCommandType.CHANGE_SEARCHER, payload: {searcherType: SearcherType}};

export type SearchWorkerResponseMessage =
    { resultType: SearchWorkerResponseType.CANCELED, payload: {dbName: DBName, query: string, searchID: number} } |
    { resultType: SearchWorkerResponseType.SEARCH_SUCCESS, payload: {dbName: DBName, query: string, results: PerDictResults, searchID: number} } |
    { resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {dbName: DBName, query: string, searchID: number, failure: SearchFailure} } |
    { resultType: SearchWorkerResponseType.DB_LOAD_SUCCESS, payload: {dbName: DBName} };

type WorkerInitializedState =
    {init: WorkerInitState.UNINITIALIZED} |
    {init: WorkerInitState.FAILED_TO_PREPARE, dbName: DBName, langDB: LangDB} |
    {init: WorkerInitState.LOADING, dbName: DBName, langDB: LangDB, searcher: Searcher} |
    {init: WorkerInitState.LOADED, dbName: DBName, langDB: LangDB, searcher: Searcher} |
    {init: WorkerInitState.SEARCHING, dbName: DBName, langDB: LangDB, searcher: Searcher, ogs: OngoingSearch, searchID: number};

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

    start(dbName: DBName, langDB: LangDB, debug: boolean, searcherType: SearcherType) {
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


    // TODO: replace postMessage with function taking typed union
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
                    ongoingSearch.parsePromise?.then((results) => {

                        // TODO: XXX: find a better way to assert enum type. (I'm on a plane and don't know TS. Forgive me.)
                        if ((results as PerDictResults).results !== undefined) {
                            this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_SUCCESS, payload: {query, results: results as PerDictResults, dbName, searchID}});
                        } else {
                            this.sendResponse({resultType: SearchWorkerResponseType.SEARCH_FAILURE, payload: {query, dbName, searchID, failure: results as SearchFailure}});
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
