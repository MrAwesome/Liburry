import {DATABASES} from "./search_options";

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./search.worker";
import ChaTaigiOptions from "./ChaTaigiOptions";
import {DBName} from "./types";
import {SearchWorkerCommandMessage} from "./search.worker";

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

    // TODO: type the returns from a union type, and type on both sides
    //                                       vvv
    init(searchWorkerReply: (e: MessageEvent<any>) => Promise<void> ) {
        for (let [dbName, langDB] of DATABASES) {
            const worker = new Worker();
            this.searchWorkers.set(
                dbName,
                worker,
            );

            worker.onmessage = searchWorkerReply;

            this.sendCommand(worker, {command: "INIT", payload: {dbName, langDB, debug: this.options.debug}});
            this.sendCommand(worker, {command: "LOAD_DB"});
        }

    }

    cancelAllCurrent() {
        this.searchWorkers.forEach((worker, _) => this.sendCommand(worker, {command: "CANCEL"}));
    }

    searchDB(dbName: DBName, query: string, searchID: number) {
        this.searchWorkers.get(dbName)?.postMessage({command: "SEARCH", payload: {query, searchID}});
    }

    searchAll(query: string, searchID: number) {
        this.searchWorkers.forEach((worker, _) =>
            this.sendCommand(worker, {command: "SEARCH", payload: {query, searchID}}));
    }
}
