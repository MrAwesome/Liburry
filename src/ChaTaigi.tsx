import * as React from "react";

import QueryStringHandler from "./QueryStringHandler";

import {AboutPage, DebugArea, SearchBar} from "./components/components";
import EntryContainer from "./components/EntryContainer";
import type {DBName, PerDictResults} from "./types/dbTypes";
import {MainDisplayAreaMode} from "./types/displayTypes";

import getDebugConsole, {StubConsole} from "./getDebugConsole";

import SearchResultsHolder from "./SearchResultsHolder";
import {DATABASES} from "./searchSettings";

import SearchController from "./SearchController";

import {runningInJest} from "./utils";
import ChaTaigiOptions from "./ChaTaigiOptions";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(urgent): setTimeout for search / intensive computation? (in case of infinite loops) (ensure warn on timeout)
// TODO(urgent): find how to create unit tests in js, and create them
// TODO(high): give some visual indication that DBs are loading, even in search mode
// TODO(high): implement select bar (note the way it squishes on very narrow screen - create space under it?)
// TODO(high): debug and address firefox flash of blankness during font load
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
// TODO(mid): with fuzzysort, just ignore dashes and spaces? or search once with them included and once without?
// TODO(mid): show bottom bar with links to different modes
// TODO(mid): exit behavior on multiple presses of back in app mode? exit button? can you make it such that hash changes don't count as page loads?
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
// TODO(low): incorrect behavior of search box when using back/forward in browser
// TODO(low): take a nap
// TODO(wishlist): "add to desktop" shortcut
// TODO(wishlist): non-javascript support?
// TODO(wishlist): dark and light themes
// TODO(wishlist): engaging buttons - random words, random search, etc
// TODO(wishlist): typing / sentence construction mode. clicking a sentence/word adds it to a list, and clicking on it in that list deletes it (or selects it for replacement?)
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
// TODO(watch): keep an eye out for 200% CPU util. infinite search loop?
//
// Project: non-fuzzysort search
//      1) DONE: create a Searcher interface to abstract away the direct reliance on fuzzysort in the workers
//      2) find a suitably simple alternative to test, and implement Searcher for it
//      3) remove remaining reliance on fuzzy variables (note debug mode score threshold)
//      4) test out lovefield
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

const queryStringHandler = new QueryStringHandler();

export interface ChaTaigiState {
    options: ChaTaigiOptions,
    resultsHolder: SearchResultsHolder,
    loadedDBs: Map<DBName, boolean>,
}

export interface ChaTaigiStateArgs {
    options?: ChaTaigiOptions,
    resultsHolder?: SearchResultsHolder,
    loadedDBs?: Map<DBName, boolean>,
}

enum MountedState {
    INIT = "INIT",
    MOUNTED = "MOUNTED",
    UNMOUNTED = "UNMOUNTED",
}

export class ChaTaigi extends React.Component<any, any> {
    mountedState = MountedState.INIT;
    searchBar: React.RefObject<SearchBar>;
    console: StubConsole;

    searchController: SearchController;

    constructor(props: any) {
        super(props);
        this.state = {
            options: this.props.options ?? new ChaTaigiOptions(),
            loadedDBs: new Map(),
            resultsHolder: new SearchResultsHolder(),
        };

        this.console = getDebugConsole(this.state.options.debug);

        DATABASES.forEach((_, dbName) => {this.state.loadedDBs.set(dbName, false)});

        this.searchBar = React.createRef();

        this.getStateTyped = this.getStateTyped.bind(this);
        this.hashChange = this.hashChange.bind(this);
        this.mainDisplayArea = this.mainDisplayArea.bind(this);
        this.onSearchBarChange = this.onSearchBarChange.bind(this);
        this.searchQuery = this.searchQuery.bind(this);
        this.setStateTyped = this.setStateTyped.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.updateSearchBar = this.updateSearchBar.bind(this);
        this.addResultsCallback = this.addResultsCallback.bind(this);
        this.addDBLoadedCallback = this.addDBLoadedCallback.bind(this);
        this.getCurrentQueryCallback = this.getCurrentQueryCallback.bind(this);
        this.checkIfAllDBLoadedCallback = this.checkIfAllDBLoadedCallback.bind(this);
        this.clearResultsCallback = this.clearResultsCallback.bind(this);

        // Initialize the search controller with callbacks for passing information/state
        // back and forth with the main component.
        this.searchController = new SearchController(this.state.options.debug,
            {
                addResultsCallback: this.addResultsCallback,
                addDBLoadedCallback: this.addDBLoadedCallback,
                checkIfAllDBLoadedCallback: this.checkIfAllDBLoadedCallback,
                getCurrentQueryCallback: this.getCurrentQueryCallback,
                clearResultsCallback: this.clearResultsCallback,
            }
        );

        if (runningInJest()) {
            const {mockResults} = this.props;
            if (mockResults !== undefined) {
                this.state.resultsHolder.addResults(mockResults);
            }
        }
    }

    setStateTyped(state: ChaTaigiStateArgs | ((prevState: ChaTaigiState) => any)) {
        // TODO: Restructure callbacks such that they don't live on the component?
        if (this.mountedState !== MountedState.MOUNTED) {
            this.console.warn("Attempting to change state after unmount! MountedState: ", this.mountedState, "State: ", state);
        } else {
            this.setState(state)
        }
    }

    getStateTyped(): ChaTaigiState {
        return this.state as ChaTaigiState;
    }

    componentDidMount() {
        this.mountedState = MountedState.MOUNTED;

        const {options} = this.getStateTyped();
        this.console.timeLog("initToAllDB", "componentDidMount");

        // TODO: does this need to happen here? can we just start a search?
        this.updateSearchBar(options.query);

        if (!runningInJest()) {
            this.searchController.startWorkersAndListener(options.searcherType);
        }

        window.addEventListener("hashchange", this.hashChange);
    }

    componentWillUnmount() {
        this.mountedState = MountedState.UNMOUNTED;
        window.removeEventListener("hashchange", this.hashChange);
    }

    hashChange(_e: HashChangeEvent) {
        const oldOptions = this.getStateTyped().options;
        const newOptions = queryStringHandler.parse();

        if (newOptions.query !== oldOptions.query) {
            this.updateSearchBar(newOptions.query);
            this.searchQuery(newOptions.query);
        }

        this.setStateTyped({options: newOptions});
    }

    // NOTE: we don't need to update state here - the hash change does that for us.
    setMode(mode: MainDisplayAreaMode) {
        const queryStringHandler = new QueryStringHandler();
        queryStringHandler.updateMode(mode);
    }

    updateSearchBar(query: string) {
        if (this.searchBar.current) {
            this.searchBar.current.updateAndFocus(query);
        }
    }

    async addResultsCallback(results: PerDictResults) {
        this.setStateTyped((state) => state.resultsHolder.addResults(results));
    }

    async addDBLoadedCallback(dbName: DBName) {
        this.setStateTyped((state) => state.loadedDBs.set(dbName, true));
    }

    async clearResultsCallback() {
        this.setStateTyped((state) => state.resultsHolder.clear());
    }

    checkIfAllDBLoadedCallback(): boolean {
        return Array.from(this.getStateTyped().loadedDBs.values()).every(x => x);
    }

    getCurrentQueryCallback(): string {
        return this.getStateTyped().options.query;
    }

    onSearchBarChange(e: any) {
        const {target = {}} = e;
        const {value = ""} = target;
        const query = value;

        this.searchQuery(query);
    }

    updateQuery(query: string) {
        this.setStateTyped((state) => ({options: {...state.options, query: query}}));
        queryStringHandler.updateQuery(query);
    }

    searchQuery(query: string) {
        this.searchController.search(query);
        this.updateQuery(query);
        this.setMode(MainDisplayAreaMode.SEARCH);
    }

    getEntries(): JSX.Element {
        const {resultsHolder, options} = this.getStateTyped();
        const entries = resultsHolder.getAllResults();

        const entryContainers = entries.map((entry) => <EntryContainer debug={options.debug} entry={entry} key={entry.key} />);

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
                return this.mainAreaHomeView();
        }
    }

    // TODO: create a HomePage element
    mainAreaHomeView() {
        const {loadedDBs, options} = this.getStateTyped();
        if (options.debug) {
            return <>
                <DebugArea loadedDBs={loadedDBs} />
            </>
        } else {
            return <></>;
        }
    }

    render() {
        const {onSearchBarChange} = this;
        const {options} = this.getStateTyped();

        return (
            <div className="ChaTaigi">
                <SearchBar ref={this.searchBar} onChange={onSearchBarChange} />
                {this.mainDisplayArea(options.mainMode)}
            </div>
        );
        // TODO: place a filler element inside SelectBar with the same height, at the bottom of the page
        //{options.debug ? <SelectBar /> : null}
    }
}

