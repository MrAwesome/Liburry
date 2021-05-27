import * as React from "react";

import QueryStringHandler from "./QueryStringHandler";

import {AboutPage, DebugArea, SearchBar, SelectBar} from "./components/components";
import {EntryContainer} from "./components/entry_container";
import {DBName, MainDisplayAreaMode} from "./types";

import debugConsole from "./debug_console";

import SearchValidityManager from "./SearchValidityManager";
import SearchResultsHolder from "./SearchResultsHolder";
import SearchWorkerManager from "./SearchWorkerManager";
import {DATABASES} from "./search_options";
import {SearchWorkerResponseMessage, SearchWorkerResponseType} from "./search.worker";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(urgent): debug and address firefox flash of blankness during font load
// TODO(urgent): integration tests
// TODO(urgent): find how to create unit tests in js, and create them
// TODO(high): chase down error causing duplicate search entries
// TODO(high): create side box for dbname/alttext/etc, differentiate it with vertical line?
// TODO(high): better styling, fewer borders
// TODO(high): fix integration tests: https://stackoverflow.com/questions/42567535/resolving-imports-using-webpacks-worker-loader-in-jest-tests
// TODO(high): decide how to handle hoabun vs taibun, settings for display
// TODO(high): show/search typing input
// TODO(high): make fonts bigger across the board
// TODO(high): asynchronous font loading: https://css-tricks.com/the-best-font-loading-strategies-and-how-to-execute-them/
// TODO(high): let hyphens and spaces be interchangeable in search
// TODO(high): come up with a more elegant/extensible way of transforming a db entry into elements to be displayed
// TODO(high): change name to chaa5_taigi (chhâ)
// TODO(high): determine why duplicate search results are sometimes returned (see "a" results for giku)
// TODO(high): fix icon sizes/manifest: https://github.com/facebook/create-react-app/blob/master/packages/cra-template/template/public/manifest.json (both ico and icon)
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
// TODO(mid): show bottom bar with links to different modes
// TODO(mid): ensure that any navigational links include characters/POJ (or have a fast language switch)
// TODO(mid): split maryknoll into multiple pieces?
// TODO(mid): download progress indicators
// TODO(mid): keybinding for search (/)
// TODO(mid): Handle parentheses in pojUnicode in maryknoll: "kàu chia (án-ni) jî-í" (giku), "nā-tiāⁿ (niā-tiāⁿ, niā-niā)" (maryknoll) {{{ create github issue for chhoetaigidatabase }}}
// TODO(mid): "search only as fallback"
// TODO(mid): link to pleco/wiktionary for chinese characters, poj, etc
// TODO(mid): long press for copy on mobile
// TODO(mid): replace loading placeholder with *grid* of db loading updates
// TODO(mid): move search bar to middle of page when no results and no search yet
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): better color for manifest.json theme
// TODO(low): in db load indicator, have a separate icon for downloading and loading
// TODO(low): font size button
// TODO(low): locally-stored settings, or users
// TODO(low): abstract away searching logic to avoid too much fuzzysort-specific code
// TODO(low): configurable searches (exact search, slow but better search, etc)
// TODO(low): move to camelCase filename
// TODO(low): move to camelCase variable names
// TODO(low): move to camelCase repository name
// TODO(low): notify when DBs fail to load
// TODO(low): radio buttons of which text to search
// TODO(low): hoabun text click should copy hoabun?
// TODO(low): title
// TODO(low): copyright, links, etc
// TODO(low): settings
// TODO(low): fix the default/preview text
// TODO(low): check web.dev/measure
// TODO(low): 'X' button for clearing search (search for an svg)
// TODO(low): replicate "cannot read property dbName" of null race condition
// TODO(low): install button in settings page
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
// TODO(later): store options between sessions
// TODO(later): run a spellchecker on "english"
// TODO(other): reclassify maryknoll sentences as examples? or just as not-words?
// TODO(other): reclassify maryknoll alternates, possibly cross-reference most taibun from others into it?
//
// Project: Integration tests
//      1) Determine how to mock
//      2) Mock out calls to search worker initialization
//      3) Simulate worker responses, if possible. If not, set fake results directly.
//      4) Test for the display of:
//          a) entries, when results are populated
//          b) about/contact/etc pages, when appropriate MainDisplayAreaMode is set
//          c) inverse when above aren't true
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

debugConsole.time("initToAllDB");
let queryStringHandler = new QueryStringHandler();
let options = queryStringHandler.parse();

export interface ChaTaigiState {
    resultsHolder: SearchResultsHolder,
    loadedDBs: Map<DBName, boolean>,
}

export interface ChaTaigiStateArgs {
    resultsHolder?: SearchResultsHolder,
    loadedDBs?: Map<DBName, boolean>,
}

export class ChaTaigi extends React.Component<any, any> {
    searchBar: React.RefObject<SearchBar>;
    query = queryStringHandler.parse().query;

    searchWorkerManager = new SearchWorkerManager(options);
    searchValidityManager = new SearchValidityManager();

    constructor(props: any) {
        super(props);
        this.state = {
            // TODO: determine if options should live in the state, including query
            mode: options.mainMode,
            loadedDBs: new Map(),
            resultsHolder: new SearchResultsHolder(),
        };

        DATABASES.forEach((_, dbName) => {this.state.loadedDBs.set(dbName, false)});

        this.searchBar = React.createRef();

        this.cancelOngoingSearch = this.cancelOngoingSearch.bind(this);
        this.getStateTyped = this.getStateTyped.bind(this);
        this.hashChange = this.hashChange.bind(this);
        this.mainDisplayArea = this.mainDisplayArea.bind(this);
        this.onChange = this.onChange.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.searchQuery = this.searchQuery.bind(this);
        this.searchWorkerReply = this.searchWorkerReply.bind(this);
        this.setStateTyped = this.setStateTyped.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.updateSearchBar = this.updateSearchBar.bind(this);
    }

    setStateTyped(state: ChaTaigiStateArgs | ((prevState: ChaTaigiState) => any)) {
        this.setState(state)
    }

    getStateTyped(): ChaTaigiState {
        return this.state as ChaTaigiState;
    }

    componentDidMount() {
        debugConsole.timeLog("initToAllDB", "componentDidMount");
        this.updateSearchBar();

        this.searchWorkerManager.init(this.searchWorkerReply);
        window.addEventListener("hashchange", this.hashChange);

    }

    hashChange(_e: HashChangeEvent) {
        const options = new QueryStringHandler().parse();

        // TODO: move query to options? rename it context?
        if (this.query !== options.query) {
            this.updateQuery(options.query);
            this.updateSearchBar();
            this.searchQuery();
        }

        if (this.state.mode !== options.mainMode) {
            this.setState({mode: options.mainMode});
        }
    }

    // Note that we don't need to update state here - the hash change does that for us.
    setMode(mode: MainDisplayAreaMode) {
        queryStringHandler.updateMode(mode);
    }

    updateSearchBar() {
        if (this.searchBar.current) {
            this.searchBar.current.updateAndFocus(this.query);
        }
    }

    // TODO: move this logic and other search-related logic elsewhere
    async searchWorkerReply(e: MessageEvent<SearchWorkerResponseMessage>) {
        const message = e.data;
        switch (message.resultType) {
            case SearchWorkerResponseType.SEARCH_SUCCESS: {
                // TODO: handle null dbName
                let {results, dbName, searchID} = message.payload;
                debugConsole.time("searchRender-" + dbName);

                const wasInvalidated = this.searchValidityManager.isInvalidated(searchID);
                if (!wasInvalidated) {
                    this.setStateTyped((state) => state.resultsHolder.addResults(results));
                }
                debugConsole.timeEnd("searchRender-" + dbName);
            }
                break;
            case SearchWorkerResponseType.SEARCH_FAILURE: {
                let {query, dbName, searchID} = message.payload;

                // TODO: use a brief setTimeout here?
                console.warn(`Encountered a failure on ${dbName} on search "${query}". Trying again...`);
                if (this.searchValidityManager.attemptRetry(dbName, searchID)) {
                    this.searchWorkerManager.searchDB(dbName, query, searchID);
                } else {
                    console.warn(`Got no results from ${dbName} on search "${query}". Ran out of retries!`);
                }
            }
                break;
            case SearchWorkerResponseType.DB_LOAD_SUCCESS: {
                let {dbName} = message.payload;
                debugConsole.time("dbLoadRender-" + dbName);
                this.setStateTyped((state) => state.loadedDBs.set(dbName, true));
                debugConsole.timeEnd("dbLoadRender-" + dbName);

                if (this.query) {
                    this.searchWorkerManager.searchDB(dbName, this.query, this.searchValidityManager.currentSearchIndex);
                    this.searchValidityManager.bump();
                }

                if (Array.from(this.state.loadedDBs.values()).every(x => x)) {
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

        this.updateQuery(query);
        this.searchQuery();
    }

    updateQuery(query: string) {
        this.query = query;
        queryStringHandler.updateQuery(query);
    }

    resetSearch() {
        this.updateQuery("");
        this.setStateTyped((state) => state.resultsHolder.clear());
    }

    cancelOngoingSearch() {
        this.searchValidityManager.invalidate();
        this.searchWorkerManager.cancelAllCurrent();
    }

    searchQuery() {
        const query = this.query;

        this.cancelOngoingSearch();

        if (query === "") {
            this.resetSearch();
        } else {
            this.searchWorkerManager.searchAll(query, this.searchValidityManager.currentSearchIndex);
            this.searchValidityManager.bump();
        }

        this.setMode(MainDisplayAreaMode.SEARCH);
    }

    getEntries(): JSX.Element {
        const {resultsHolder} = this.getStateTyped();
        const entries = resultsHolder.getAllResults();

        const entryContainers = entries.map((entry) => <EntryContainer entry={entry} key={entry.key} />);

        return <>{entryContainers}</>;
    }

    mainDisplayArea(mode: MainDisplayAreaMode): JSX.Element {
        switch (mode) {
            case MainDisplayAreaMode.SEARCH:
                return this.getEntries();
            case MainDisplayAreaMode.ABOUT:
                return <AboutPage />;
            case MainDisplayAreaMode.SETTINGS:
            case MainDisplayAreaMode.CONTACT:
            case MainDisplayAreaMode.HOME:
                return this.mainAreaDefaultView();
        }
    }

    // TODO: Create individual components for these if necessary
    mainAreaDefaultView() {
        const {loadedDBs} = this.getStateTyped();
        if (options.debug) {
            return <>
                <DebugArea loadedDBs={loadedDBs} />
            </>
        } else {
            return <></>;
        }
    }

    render() {
        const {onChange} = this;
        const options = queryStringHandler.parse();
        const mainDisplayAreaMode = options.mainMode;

        return (
            <div className="ChaTaigi">
                <SearchBar ref={this.searchBar} onChange={onChange} />
                {this.mainDisplayArea(mainDisplayAreaMode)}
                {options.debug ? <SelectBar /> : null}
            </div>
        );
    }
}

