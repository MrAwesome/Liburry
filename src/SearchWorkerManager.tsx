// eslint-disable-next-line import/no-webpack-loader-syntax
import type Worker from "worker-loader!./search.worker";

import {SearchWorkerCommandMessage, SearchWorkerCommandType, SearchWorkerResponseMessage} from "./search.worker";
import getDebugConsole, {StubConsole} from "./getDebugConsole";
import {SearcherType} from "./search";
import {runningInJest} from "./utils";
import {AppConfig, DBIdentifier} from "./types/config";

export default class SearchWorkerManager {
    private searchWorkers: Map<DBIdentifier, Worker> = new Map();
    private console: StubConsole;

    constructor(
        private appConfig: AppConfig,
        private debug: boolean,
    ) {
        this.console = getDebugConsole(debug);

        this.searchAll = this.searchAll.bind(this);
        this.cancelAllCurrent = this.cancelAllCurrent.bind(this);
        this.init = this.init.bind(this);
        this.searchSpecificDB = this.searchSpecificDB.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
    }

    // NOTE: workers are still started one-per-db, and identified by their DB's identifier.
    //       This can certainly change in the future.
    private sendCommand(dbIdentifier: DBIdentifier, worker: Worker, command: SearchWorkerCommandMessage) {
        this.console.log(`Sending command to "${dbIdentifier}:`, command);
        worker.postMessage(command);
    }

    private sendAll(command: SearchWorkerCommandMessage) {
        this.searchWorkers.forEach((worker, dbIdentifier) => this.sendCommand(dbIdentifier, worker, command));
    }

    async init(searcherType: SearcherType, searchWorkerReplyHandler: (e: MessageEvent<SearchWorkerResponseMessage>) => Promise<void>) {
        // Import is here so that the import of worker code doesn't break Jest testing elsewhere.
        if (!runningInJest()) {
            /* eslint-disable import/no-webpack-loader-syntax */
            import("worker-loader!./search.worker").then((worker) => {

                this.appConfig.getAllEnabledDBConfigs().forEach((dbConfig) => {
                    const dbIdentifier = dbConfig.getDBIdentifier();
                    const searchWorker = new worker.default();
                    const rawDBConfig = dbConfig.asRaw();
                    this.searchWorkers.set(
                        dbIdentifier,
                        searchWorker,
                    );

                    searchWorker.onmessage = searchWorkerReplyHandler;

                    this.sendCommand(
                        dbIdentifier,
                        searchWorker,
                        {
                            command: SearchWorkerCommandType.INIT,
                            payload: {dbIdentifier, rawDBConfig, debug: this.debug, searcherType}
                        }
                    );
                });
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

    searchSpecificDB(dbIdentifier: DBIdentifier, query: string, searchID: number) {
        const worker = this.searchWorkers.get(dbIdentifier);
        if (worker !== undefined) {
            this.sendCommand(dbIdentifier, worker, {command: SearchWorkerCommandType.SEARCH, payload: {query, searchID}});
        } else {
            console.warn("Tried to search nonexistant DB: ", dbIdentifier);
        }
    }

    searchAll(query: string, searchID: number) {
        this.sendAll({command: SearchWorkerCommandType.SEARCH, payload: {query, searchID}});
    }

    getIdentifiersForAllActiveDBs(): DBIdentifier[] {
        return Array.from(this.searchWorkers.keys());
    }
}
