import {DATABASES} from "./search_options";

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./search.worker";
import {DBName} from "./types";
import {SearchWorkerCommandMessage, SearchWorkerCommandType, SearchWorkerResponseMessage} from "./search.worker";
import {getWorkerDebugConsole, StubConsole} from "./debug_console";
import {SearcherType} from "./search";

export default class SearchWorkerManager {
    searchWorkers: Map<string, Worker> = new Map();
    debug: boolean;
    console: StubConsole;

    constructor(debug: boolean) {
        this.debug = debug;
        this.console = getWorkerDebugConsole(debug);

        this.searchAll = this.searchAll.bind(this);
        this.cancelAllCurrent = this.cancelAllCurrent.bind(this);
        this.init = this.init.bind(this);
        this.searchSpecificDB = this.searchSpecificDB.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
    }

    private sendCommand(dbName: DBName, worker: Worker, command: SearchWorkerCommandMessage) {
        this.console.log(`Sending command to "${dbName}:`, command);
        worker.postMessage(command);
    }

    private sendAll(command: SearchWorkerCommandMessage) {
        this.searchWorkers.forEach((worker, dbName) => this.sendCommand(dbName, worker, command));
    }

    init(searcherType: SearcherType, searchWorkerReplyHandler: (e: MessageEvent<SearchWorkerResponseMessage>) => Promise<void>) {
        for (let [dbName, langDB] of DATABASES) {
            const worker = new Worker();
            this.searchWorkers.set(
                dbName,
                worker,
            );

            worker.onmessage = searchWorkerReplyHandler;

            this.sendCommand(dbName, worker, {command: SearchWorkerCommandType.INIT, payload: {dbName, langDB, debug: this.debug, searcherType}});
        }

    }

    changeAllSearcherTypes(searcherType: SearcherType) {
        this.sendAll({command: SearchWorkerCommandType.CHANGE_SEARCHER, payload: {searcherType}});
    }


    cancelAllCurrent() {
        this.sendAll({command: SearchWorkerCommandType.CANCEL});
    }

    searchSpecificDB(dbName: DBName, query: string, searchID: number) {
        const worker = this.searchWorkers.get(dbName);
        if (worker !== undefined) {
            this.sendCommand(dbName, worker, {command: SearchWorkerCommandType.SEARCH, payload: {query, searchID}});
        } else {
            console.warn("Tried to search nonexistant DB: ", dbName);
        }
    }

    searchAll(query: string, searchID: number) {
        this.sendAll({command: SearchWorkerCommandType.SEARCH, payload: {query, searchID}});
    }
}
