import {DATABASES} from "./search_options";

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./search.worker";
import ChaTaigiOptions from "./ChaTaigiOptions";
import {DBName} from "./types";
import {SearchWorkerCommandMessage, SearchWorkerCommandType, SearchWorkerResponseMessage} from "./search.worker";

export default class SearchWorkerManager {
    searchWorkers: Map<string, Worker> = new Map();
    options: ChaTaigiOptions;

    constructor(options: ChaTaigiOptions) {
        this.options = options;

        this.searchAll = this.searchAll.bind(this);
        this.cancelAllCurrent = this.cancelAllCurrent.bind(this);
        this.init = this.init.bind(this);
        this.searchDB = this.searchDB.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
    }

    private sendCommand(worker: Worker, message: SearchWorkerCommandMessage) {
        worker.postMessage(message);
    }

    init(searchWorkerReply: (e: MessageEvent<SearchWorkerResponseMessage>) => Promise<void> ) {
        for (let [dbName, langDB] of DATABASES) {
            const worker = new Worker();
            this.searchWorkers.set(
                dbName,
                worker,
            );

            worker.onmessage = searchWorkerReply;

            this.sendCommand(worker, {command: SearchWorkerCommandType.INIT, payload: {dbName, langDB, debug: this.options.debug}});
            this.sendCommand(worker, {command: SearchWorkerCommandType.LOAD_DB});
        }

    }

    cancelAllCurrent() {
        this.searchWorkers.forEach((worker, _) => this.sendCommand(worker, {command: SearchWorkerCommandType.CANCEL}));
    }

    searchDB(dbName: DBName, query: string, searchID: number) {
        this.searchWorkers.get(dbName)?.postMessage({command: SearchWorkerCommandType.SEARCH, payload: {query, searchID}});
    }

    searchAll(query: string, searchID: number) {
        this.searchWorkers.forEach((worker, _) =>
            this.sendCommand(worker, {command: SearchWorkerCommandType.SEARCH, payload: {query, searchID}}));
    }
}
