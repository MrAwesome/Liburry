import {getWorkerDebugConsole, StubConsole} from "./debug_console";
import type {LangDB, DBName} from "./types";
import type {FuzzySearchableDict} from "./fuzzySortTypes";
import {fetchDB} from "./dictionary_handling";
import {OngoingSearch} from "./search";
import {fuzzysortSearch} from "./fuzzySortUtils";

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

enum WorkerInitState {
    UNINITIALIZED,
    STARTED,
    LOADED,
    SEARCHING,
}

type WorkerInitializedState =
    {init: WorkerInitState.UNINITIALIZED} |
    {init: WorkerInitState.STARTED, dbName: DBName, langDB: LangDB} |
    {init: WorkerInitState.LOADED, dbName: DBName, langDB: LangDB, db: FuzzySearchableDict} |
    {init: WorkerInitState.SEARCHING, dbName: DBName, langDB: LangDB, db: FuzzySearchableDict, ogs: OngoingSearch};

class SearchWorkerHelper {
    state: WorkerInitializedState = {init: WorkerInitState.UNINITIALIZED};
    debug: boolean = false;
    console: StubConsole = getWorkerDebugConsole(false);

    start(dbName: DBName, langDB: LangDB, debug: boolean) {
        this.state = {init: WorkerInitState.STARTED, dbName, langDB};
        this.console = getWorkerDebugConsole(debug);
        this.debug = debug;
        // TODO: send message back for start, to avoid race?
    }

    loadDB() {
        if (this.state.init === WorkerInitState.STARTED) {
            const dbName = this.state.dbName;
            const langDB = this.state.langDB;
            fetchDB(dbName, langDB, this.debug).then(
                (searchableDict) => {
                    this.state = {init: WorkerInitState.LOADED, db: searchableDict, dbName, langDB};
                    ctx.postMessage({resultType: "DB_LOAD_SUCCESS", payload: {dbName}});
                });
        } else {
            this.log();
            console.error("Attempted to load db before worker initialization!")
        }
    }

    search(query: string, searchID: number) {
        switch (this.state.init) {
            case WorkerInitState.SEARCHING:
                this.cancel();
                this.search(query, searchID);
                break;
            case WorkerInitState.LOADED:
                const ongoingSearch = fuzzysortSearch(this.state.db, query, this.debug);
                const dbName = this.state.dbName;
                if (ongoingSearch !== null) {
                    const originalState = this.state;
                    this.state = {...originalState, init: WorkerInitState.SEARCHING, ogs: ongoingSearch};
                    ongoingSearch.parsePromise?.then((results) => {

//                        if (
//                            this.state.init === WorkerInitState.SEARCHING) {
//                            console.log(this.state.init
//                            , this.state.ogs.query !== query
//                            , !this.state.ogs.wasCanceled);
//                        }
//                        if (
//                            this.state.init === WorkerInitState.SEARCHING
//                            && this.state.ogs.query !== query
//                            && !this.state.ogs.wasCanceled
//                        ) {
                        ctx.postMessage({resultType: "SEARCH_SUCCESS", payload: {results, dbName, searchID}});
                        this.state = originalState;
                    });
                }
                break;
            case WorkerInitState.STARTED:
                this.log();
                console.warn("Attempted to search db before load!")
                break;
            case WorkerInitState.UNINITIALIZED:
                this.log();
                console.error("Attempted to search uninitialized DB!")
        }

    }

    cancel() {
        if (this.state.init === WorkerInitState.SEARCHING) {
            const {ogs} = this.state;
            ogs.cancel();
            this.state = {...this.state, init: WorkerInitState.LOADED};
        }
    }

    log() {
        this.console.log(this);
    }
}

// TODO: move types to d.ts, import type
var sw: SearchWorkerHelper = new SearchWorkerHelper();

// Respond to message from parent thread
ctx.addEventListener("message", (e) => {
    const command = e.data.command;
    const payload = e.data.payload;
    switch (command) {
        case "INIT":
            const {dbName, langDB, debug} = payload;
            sw.start(dbName, langDB, debug);
            break;
        case "LOAD_DB":
            sw.loadDB();
            break;
        case "SEARCH":
            const {query, searchID} = payload;
            sw.search(query, searchID);
            break;
        case "CANCEL":
            sw.cancel();
            break;
        case "LOG":
            sw.log();
            break;
    }
});

export default null as any;
