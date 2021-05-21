import * as React from "react";

import {DebugArea, SearchBar} from "./components/components";
import {EntryContainer} from "./components/entry_container";
import {ChaTaigiState, ChaTaigiStateArgs, PerDictResults, SearchResultEntry} from "./types";
import {DATABASES} from "./search_options";
import {typeGuard} from "./typeguard";
import {mod} from './utils';

import debugConsole, {DEBUG_MODE} from "./debug_console";

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./search.worker";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(urgent): chase down error causing duplicate search entries
// TODO(urgent): debug and address firefox flash of blankness during font load
// TODO(high): fix integration tests: https://stackoverflow.com/questions/42567535/resolving-imports-using-webpacks-worker-loader-in-jest-tests
// TODO(high): see if maryknoll has non-hoabun characters
// TODO(high): show/search typing input
// TODO(high): make fonts bigger across the board
// TODO(high): asynchronous font loading: https://css-tricks.com/the-best-font-loading-strategies-and-how-to-execute-them/
// TODO(high): let hyphens and spaces be interchangeable in search
// TODO(high): focus search bar on load -> enter typing mode (autofocus is working, so some re-render seems to be taking away focus) (react-burger-menu seems to steal focus?)
// TODO(high): migrate to tsx cra with service worker (see ~/my-app)
// TODO(high): come up with a more elegant/extensible way of transforming a db entry into elements to be displayed
// TODO(high): change name to chaa5_taigi (chhâ)
// TODO(high): determine why duplicate search results are sometimes returned (see "a" results for giku)
// TODO(high): change from "fullscreen" to (check) "minimal-ui"
// TODO(high): add keys as opposed to indices
// TODO(high): fix icon sizes/manifest: https://github.com/facebook/create-react-app/blob/master/packages/cra-template/template/public/manifest.json (both ico and icon)
// TODO(high): add other databases from ChhoeTaigi
//               * write out schema
//               * update conversion scripts
//               * decide on display changes for multiple DBs
// TODO(high): handle alternate spellings / parentheticals vs separate fields
// TODO(high): handle explanation text (see "le" in Giku)
// TODO(high): add copyright/about page/info
// TODO(high): Fix clipboard notif not working on most browsers
// TODO(high): Fix typing before load not searching
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): have search updates appear asynchronously from typing
// TODO(high): use react-window or react-virtualized to only need to render X results at a time
// TODO(high): create an index of all 3 categories combined, and search that as text?
// TODO(high): remove parentheses from unicode entries, treat as separate results
// TODO(high): let spaces match hyphens and vice-versa
// TODO(high): investigate more performant search solutions (lunr, jssearch, etc)
// TODO(high): benchmark, evaluate search/render perf, especially with multiple databases
// TODO(high): keyboard shortcuts
// TODO(mid): replace "var" with "let"
// TODO(mid): split maryknoll into multiple pieces?
// TODO(mid): download progress indicators
// TODO(mid): show per-db loading information
// TODO(mid): re-trigger currently-ongoing search once db loads (see top of searchDB)
// TODO(mid): keybinding for search (/)
// TODO(mid): Handle parentheses in pojUnicode in maryknoll: "kàu chia (án-ni) jî-í" (giku), "nā-tiāⁿ (niā-tiāⁿ, niā-niā)" (maryknoll) {{{ create github issue for chhoetaigidatabase }}}
// TODO(mid): "search only as fallback"
// TODO(mid): link to pleco/wiktionary for chinese characters, poj, etc
// TODO(mid): unit/integration tests
// TODO(mid): long press for copy on mobile
// TODO(mid): replace loading placeholder with *grid* of db loading updates
// TODO(mid): move search bar to middle of page when no results and no search yet
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): font size button
// TODO(low): locally-stored settings, or users
// TODO(low): abstract away searching logic to avoid too much fuzzysort-specific code
// TODO(low): have GET param for search (and options?)
// TODO(low): configurable searches (exact search, slow but better search, etc)
// TODO(low): hashtag load entry (for linking)
// TODO(low): move to camelCase
// TODO(low): prettier search/load indicators
// TODO(low): notify when DBs fail to load
// TODO(low): store options between sessions
// TODO(low): radio buttons of which text to search
// TODO(low): hoabun text click should copy hoabun?
// TODO(low): title
// TODO(low): copyright, links, etc
// TODO(low): settings
// TODO(low): fix the default/preview text
// TODO(low): check web.dev/measure
// TODO(low): replace !some with every
// TODO(wishlist): "add to desktop" shortcut
// TODO(wishlist): non-javascript support?
// TODO(wishlist): dark and light themes
// TODO(wishlist): engaging buttons - random words, random search, etc
// TODO(later): homepage
// TODO(later): homepage WOTD
// TODO(later): download CSVs, do initial processing via js, store in service worker (if possible?)
// TODO(later): "show me random words"
// TODO(later): "show me words of this particular word type" (see "abbreviations" field in embree)
// TODO(later): use embree noun classifier / word type in other dbs
// TODO(later): include soatbeng/explanations
// TODO(later): include alternates (very hard with maryknoll)
// TODO(later): remove parentheticals from maryknoll entries
// TODO(later): generalize for non-english definition
// TODO(later): word similarity analysis, link to similar/possibly-related words (this could be added to the CSVs)
// TODO(later): allow for entries to be marked incomplete/broken
// TODO(later): link to ChhoeTaigi for entries
// TODO(later): cross-reference noun classifiers across DBs (and noun status)
// TODO(later): accessibility? what needs to be done? link to POJ screen readers?
// TODO(other): reclassify maryknoll sentences as examples? or just as not-words?
// TODO(other): reclassify maryknoll alternates, possibly cross-reference most taibun from others into it?
//
// Project: Taibun definitions
//      1) generalize "english" to definition
//      2) solidify transitional schema (soatbeng? or save that for later?) (hoabun vs hanlo_taibun_poj?)
//      3) modify build script to generate json files
//      4) create schemas under current model
//      5) modify containers if needed
//      6) test performance
//      7) create settings page with language toggle?


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

    setStateTyped(state: ChaTaigiStateArgs<PerDictResults | null> | ((prevState: ChaTaigiState<PerDictResults | null>) => any)) {
        this.setState(state)
    }

    getStateTyped(): ChaTaigiState<PerDictResults | null> {
        return this.state as ChaTaigiState<PerDictResults | null>;
    }

    componentDidMount() {
        debugConsole.timeLog("initToAllDB", "componentDidMount");
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

            worker.postMessage({command: "INIT", payload: {dbName, langDB, debug: DEBUG_MODE}});
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
        const allPerDictResults = [...currentResults.values()].filter(typeGuard) as PerDictResults[];

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
}
