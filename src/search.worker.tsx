import debugConsole from "./debug_console";
import type {LangDB, DBName, SearchableDict, PerDictResults} from "./types";
import {fetchDB} from "./dictionary_handling";
import {OngoingSearch, searchDB} from "./search";

// TODO(low): use enum for states

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

type WorkerInitializedState =
    {init: "uninitialized"} |
    {init: "started", dbName: DBName, langDB: LangDB} |
    {init: "loaded", dbName: DBName, langDB: LangDB, db: SearchableDict} |
    {init: "searching", dbName: DBName, langDB: LangDB, db: SearchableDict, ogs: OngoingSearch<PerDictResults>};

class SearchWorkerHelper {
    state: WorkerInitializedState = {init: "uninitialized"};

    start(dbName: DBName, langDB: LangDB) {
        this.state = {init: "started", dbName: dbName, langDB: langDB};
        // TODO: send message back for start, to avoid race?
    }

    loadDB() {
        if (this.state.init === "started") {
            const dbName = this.state.dbName;
            const langDB = this.state.langDB;
            fetchDB(dbName, langDB).then(
                (searchableDict) => {
                    this.state = {init: "loaded", db: searchableDict, dbName, langDB};
                    ctx.postMessage({resultType: "DB_LOAD_SUCCESS", payload: {dbName}});
                });
        } else {
            this.log();
            console.error("Attempted to load db before worker initialization!")
        }
    }

    search(query: string, searchID: number) {
        switch (this.state.init) {
            case "searching":
                this.cancel();
                this.search(query, searchID);
                break;
            case "loaded":
                const ongoingSearch = searchDB(this.state.db, query);
                const dbName = this.state.dbName;
                if (ongoingSearch !== null) {
                    const originalState = this.state;
                    this.state = {...originalState, init: "searching", ogs: ongoingSearch};
                    ongoingSearch.parsePromise?.then((results) => {

//                        if (
//                            this.state.init === "searching") {
//                            console.log(this.state.init
//                            , this.state.ogs.query !== query
//                            , !this.state.ogs.wasCanceled);
//                        }
//                        if (
//                            this.state.init === "searching"
//                            && this.state.ogs.query !== query
//                            && !this.state.ogs.wasCanceled
//                        ) {
                        ctx.postMessage({resultType: "SEARCH_SUCCESS", payload: {results, dbName, searchID}});
                        this.state = originalState;
                    });
                }
                break;
            case "started":
                this.log();
                console.error("Attempted to search db before load!")
                break;
            case "uninitialized":
                this.log();
                console.error("Attempted to search uninitialized DB!")
        }

    }

    cancel() {
        if (this.state.init === "searching") {
            const {ogs} = this.state;
            ogs.cancel();
            this.state = {...this.state, init: "loaded"};
        }
    }

    log() {
        debugConsole.log(this);
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
            const {dbName, langDB} = payload;
            sw.start(dbName, langDB);
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
