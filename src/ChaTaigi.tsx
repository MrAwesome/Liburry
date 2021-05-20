import * as React from "react";

import {DebugArea, SearchBar} from "./components/components";
import {EntryContainer} from "./components/entry_container";
import {ChaTaigiState, ChaTaigiStateArgs, PerDictResults, SearchResultEntry} from "./types";
import {DATABASES} from "./search_options";
import {typeGuard} from "./typeguard";
import {mod} from './utils';

import debugConsole from "./debug_console";


// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./search.worker";

export class ChaTaigi extends React.Component<any, any> {
    searchBar: React.RefObject<SearchBar>;
    query = "";

    // TODO: move these into their own helper class?
    searchWorkers: Map<string, Worker> = new Map();
    searchInvalidations: Array<boolean> = Array.from({length: 10}).map(_ => false);
    currentSearchIndex: number = 0;

    constructor(props: any) {
        super(props);
        this.state = {
            currentResults: new Map(),
            loadedDBs: new Map(),
        };

        DATABASES.forEach((_, dbName) => {this.state.loadedDBs.set(dbName, false)});

        this.searchBar = React.createRef();

        this.onChange = this.onChange.bind(this);
        this.searchQuery = this.searchQuery.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.setStateTyped = this.setStateTyped.bind(this);
        this.getStateTyped = this.getStateTyped.bind(this);
        this.cancelOngoingSearch = this.cancelOngoingSearch.bind(this);
        this.searchWorkerReply = this.searchWorkerReply.bind(this);
        this.menu = this.menu.bind(this);
    }

    setStateTyped(state: ChaTaigiStateArgs<PerDictResults> | ((prevState: ChaTaigiState<PerDictResults>) => any)) {
        this.setState(state)
    }

    getStateTyped(): ChaTaigiState<PerDictResults> {
        return this.state as ChaTaigiState<PerDictResults>;
    }

    componentDidMount() {
        console.timeLog("initToAllDB", "componentDidMount");
        if (this.searchBar.current) {
            this.searchBar.current.textInput.current.focus();
        }

        for (let [dbName, langDB] of DATABASES) {
            const worker = new Worker();
            this.searchWorkers.set(
                dbName,
                worker,
            );

            worker.onmessage = this.searchWorkerReply;

            worker.postMessage({command: "INIT", payload: {dbName, langDB}});
            worker.postMessage({command: "LOAD_DB"});
        }
    }

    async searchWorkerReply(e: MessageEvent<any>) {
        const rt = e.data.resultType;
        const payload = e.data.payload;
        switch (rt) {
            case "SEARCH_SUCCESS": {
                let {results, dbName, searchID} = payload;
                debugConsole.time("searchRender-" + dbName);
                if (!this.searchInvalidations[searchID]) {
                    this.setStateTyped((state) => {
                        return state.currentResults.set(dbName, results);
                    });
                }
                debugConsole.timeEnd("searchRender-" + dbName);
            }
                break;
            case "DB_LOAD_SUCCESS": {
                let {dbName} = payload;
                debugConsole.time("dbLoadRender-" + dbName);
                this.setStateTyped((state) => {
                    return state.loadedDBs.set(dbName, true);
                });
                debugConsole.timeEnd("dbLoadRender-" + dbName);

                this.searchQuery();

                if (!Array.from(this.state.loadedDBs.values()).some(x => !x)) {
                    debugConsole.log("All databases loaded!");
                    debugConsole.timeEnd("initToAllDB");
                }
            }
                break;
            default:
                console.warn("Received unknown message from search worker!", e);
        }
    }

    onChange(e: any) {
        const {target = {}} = e;
        const {value = ""} = target;
        const query = value;

        this.query = query;
        this.searchQuery();
    }

    menu() {
        // TODO: performance testing
        return null;
        //return <ChaMenu />;
    }

    resetSearch() {
        this.query = "";

        this.setStateTyped((state) => {
            state.currentResults.clear();
            return state;
        });
    }

    cancelOngoingSearch() {
        this.searchInvalidations[mod(this.currentSearchIndex - 1, this.searchInvalidations.length)] = true;
        this.searchWorkers.forEach(
            (worker, _) =>
                worker.postMessage({command: "CANCEL"})
        );
    }

    searchQuery() {
        const query = this.query;

        this.cancelOngoingSearch();

        if (query === "") {
            this.resetSearch();
        } else {
            this.searchWorkers.forEach((worker, _) =>
                worker.postMessage({command: "SEARCH", payload: {query, searchID: this.currentSearchIndex}}));

            this.currentSearchIndex = mod(this.currentSearchIndex + 1, this.searchInvalidations.length);
            this.searchInvalidations[this.currentSearchIndex] = false;
        }
    }

    render() {
        const {onChange} = this;
        const {currentResults, loadedDBs} = this.getStateTyped();
        // TODO: strengthen typing, find out why "undefined" can get passed from search results
        const allPerDictResults = [...currentResults.values()].filter(typeGuard);

        var shouldDisplayDebugArea = currentResults.size === 0;
        const dbg = shouldDisplayDebugArea ? <DebugArea loadedDBs={loadedDBs} /> : null;
        const entries = getEntries(allPerDictResults);

        return (
            <div className="ChaTaigi">
                <div className="non-menu">
                    <SearchBar ref={this.searchBar} onChange={onChange} />
                    <div className="search-area-buffer" />
                    {entries}
                    {dbg}
                </div>
                {this.menu()}
            </div>
        );
    }
}

// TODO: clean up, include dict names/links
function getEntries(perDictRes: PerDictResults[]): JSX.Element[] {
    let entries: SearchResultEntry[] = [];

    // Flatten out all results
    perDictRes.forEach((perDict: PerDictResults) => {
        perDict.results.forEach((entry: SearchResultEntry) => {
            entries.push(entry);
        });
    });

    entries.sort((a, b) => b.dbSearchRanking - a.dbSearchRanking);

    const entryContainers = entries.map((entry) => <EntryContainer entry={entry} key={entry.key} />);

    return entryContainers;
    //return <IntermediatePerDictResultsElements key={perDictRes.dbName} perDictRes={perDictRes} />;
}

