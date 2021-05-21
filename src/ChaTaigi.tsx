import * as React from "react";

import {AboutPage, DebugArea, SearchBar} from "./components/components";
import {EntryContainer} from "./components/entry_container";
import {DBName, PerDictResults, SearchResultEntry} from "./types";
import {DATABASES} from "./search_options";
import {typeGuard} from "./typeguard";
import {mod} from './utils';

import debugConsole, {DEBUG_MODE} from "./debug_console";

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./search.worker";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(urgent): chase down error causing duplicate search entries
// TODO(urgent): debug and address firefox flash of blankness during font load
// TODO(high): create side box for dbname/alttext/etc, differentiate it with vertical line?
// TODO(high): better styling, fewer borders
// TODO(high): fix integration tests: https://stackoverflow.com/questions/42567535/resolving-imports-using-webpacks-worker-loader-in-jest-tests
// TODO(high): decide how to handle hoabun vs taibun, settings for display
// TODO(high): show/search typing input
// TODO(high): make fonts bigger across the board
// TODO(high): asynchronous font loading: https://css-tricks.com/the-best-font-loading-strategies-and-how-to-execute-them/
// TODO(high): let hyphens and spaces be interchangeable in search
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
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): create an index of all 3 categories combined, and search that as text?
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
// TODO(low): 'X' button for clearing search
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
// Project: Stateful non-search area
//      1) Clean up menu code
//      2) Make area disappear during search, but maintain its current state (aka have a non-search-results entity)
//      3) Determine which areas to add and what they will look like
//
// Project: Taibun definitions
//      1) DONE: generalize "english" to definition
//      2) solidify transitional schema (soatbeng? or save that for later?) (hoabun vs hanlo_taibun_poj?)
//      3) modify build script to generate json files
//      4) create schemas under current model
//      5) modify containers if needed
//      6) test performance
//      7) create settings page with language toggle?

enum MainDisplayAreaMode {
    DEFAULT,
    SEARCH,
    ABOUT,
    CONTACT,
    SETTINGS,
}

class ResultsHolder {
    currentResults: Map<DBName, PerDictResults> = new Map();
    numResults: number = 0;

    addResults(res: PerDictResults): this {
        this.currentResults.set(res.dbName, res);
        this.numResults += res.results.length;
        return this;
    }

    clear(): this {
        this.currentResults = new Map();
        this.numResults = 0;
        return this;
    }

    getNumResults(): number {
        return this.numResults;
    }

    getAllResults(): SearchResultEntry[] {
        let allPerDictRes = Array.from(this.currentResults.values()).filter(typeGuard) as PerDictResults[];

        let entries: SearchResultEntry[] = [];

        // Flatten out all results
        allPerDictRes.forEach((perDict: PerDictResults) => {
            perDict.results.forEach((entry: SearchResultEntry) => {
                entries.push(entry);
            });
        });

        // TODO: Sort on add? Sort first in worker?
        entries.sort((a, b) => b.dbSearchRanking - a.dbSearchRanking);

        return entries;
    }
}

export interface ChaTaigiState {
    resultsHolder: ResultsHolder,
    loadedDBs: Map<DBName, boolean>,
}

export interface ChaTaigiStateArgs {
    resultsHolder?: ResultsHolder,
    loadedDBs?: Map<DBName, boolean>,
}

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
            loadedDBs: new Map(),
            resultsHolder: new ResultsHolder(),
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
        this.mainDisplayArea = this.mainDisplayArea.bind(this);
        this.determineMainDisplayAreaMode = this.determineMainDisplayAreaMode.bind(this);
    }

    setStateTyped(state: ChaTaigiStateArgs | ((prevState: ChaTaigiState) => any)) {
        this.setState(state)
    }

    getStateTyped(): ChaTaigiState {
        return this.state as ChaTaigiState;
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
                    this.setStateTyped((state) => state.resultsHolder.addResults(results));
                }
                debugConsole.timeEnd("searchRender-" + dbName);
            }
                break;
            case "DB_LOAD_SUCCESS": {
                let {dbName} = payload;
                debugConsole.time("dbLoadRender-" + dbName);
                this.setStateTyped((state) => state.loadedDBs.set(dbName, true));
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

    resetSearch() {
        this.query = "";
        this.setStateTyped((state) => state.resultsHolder.clear());
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

    getEntries(): JSX.Element {
        const {resultsHolder} = this.getStateTyped();
        const entries = resultsHolder.getAllResults();

        const entryContainers = entries.map((entry) => <EntryContainer entry={entry} key={entry.key} />);

        return <>{entryContainers}</>;
    }

    determineMainDisplayAreaMode(): MainDisplayAreaMode {
        const {resultsHolder} = this.getStateTyped();


        if (resultsHolder.getNumResults() > 0) {
            return MainDisplayAreaMode.SEARCH;
        }

        return MainDisplayAreaMode.DEFAULT;
    }

    mainDisplayArea(mode: MainDisplayAreaMode): JSX.Element {
        switch (mode) {
            case MainDisplayAreaMode.SEARCH:
                return this.getEntries();
            case MainDisplayAreaMode.ABOUT:
                return <AboutPage />;
            default:
                return this.mainAreaDefaultView();
        }
    }

    // TODO: Create individual components for these if necessary
    mainAreaDefaultView() {
        const {loadedDBs} = this.getStateTyped();
        return <>
            <DebugArea loadedDBs={loadedDBs} />
        </>
    }

    render() {
        const {onChange} = this;
        const mainDisplayAreaMode = this.determineMainDisplayAreaMode();

        return (
            <div className="ChaTaigi">
                <SearchBar ref={this.searchBar} onChange={onChange} />
                {this.mainDisplayArea(mainDisplayAreaMode)}
            </div>
        );
    }
}

