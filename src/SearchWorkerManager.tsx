import {DATABASES} from "./searchSettings";

// eslint-disable-next-line import/no-webpack-loader-syntax
import type Worker from "worker-loader!./search.worker";

import {DBName} from "./types/dbTypes";
import {SearchWorkerCommandMessage, SearchWorkerCommandType, SearchWorkerResponseMessage} from "./search.worker";
import getDebugConsole, {StubConsole} from "./getDebugConsole";
import {SearcherType} from "./search";
import {runningInJest} from "./utils";

export default class SearchWorkerManager {
    private searchWorkers: Map<DBName, Worker> = new Map();
    private debug: boolean;
    private console: StubConsole;

    constructor(debug: boolean) {
        this.debug = debug;
        this.console = getDebugConsole(debug);

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

    async init(searcherType: SearcherType, searchWorkerReplyHandler: (e: MessageEvent<SearchWorkerResponseMessage>) => Promise<void>) {
        // Import is here so that the import of worker code doesn't break Jest testing elsewhere.
        if (!runningInJest()) {
            import("worker-loader!./search.worker").then((worker) => {

                for (let [dbName, langDB] of DATABASES) {

                    const searchWorker = new worker.default();
                    this.searchWorkers.set(
                        dbName,
                        searchWorker,
                    );

                    searchWorker.onmessage = searchWorkerReplyHandler;

                    this.sendCommand(dbName, searchWorker, {command: SearchWorkerCommandType.INIT, payload: {dbName, langDB, debug: this.debug, searcherType}});
                }
            });
        }
    }

    async stopAll() {
        this.searchWorkers.forEach((worker, _) => worker.terminate());
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

    getAllActiveDBs(): DBName[] {
        return Array.from(this.searchWorkers.keys());
    }
}
