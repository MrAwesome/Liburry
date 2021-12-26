import * as React from "react";

import AgnosticEntryContainer from "./entry_containers/AgnosticEntryContainer";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import QueryStringHandler from "./QueryStringHandler";
import SearchController from "./SearchController";
import SearchResultsHolder from "./SearchResultsHolder";

import getDebugConsole, {StubConsole} from "./getDebugConsole";
import {AllDBLoadStats, AnnotatedPerDictResults} from "./types/dbTypes";
import {CombinedPageElement} from "./pages/Page";
import {MainDisplayAreaMode} from "./types/displayTypes";
import {SearchBar} from "./components/SearchBar";
import {runningInJest} from "./utils";
import AppConfig from "./configHandler/AppConfig";
import {LIBURRY_DEFAULT_APP} from "./constants";

import type {SearchContext} from "./SearchValidityManager";
import type {AppID, PageID, ReturnedFinalConfig, SubAppID} from "./configHandler/zodConfigTypes";
import {getFontLoader} from "./fonts/FontLoader";
import AppSelector from "./AppSelector";

// TODO(next): make contains/includes search (use index and place mark) (check perf of index v. regex etc)
// TODO(urgent): move to webpack from current method
// TODO(urgent): add an autoplay/pause button for search, to make things better on slower machines
// TODO(urgent): add a timeout to save current query to history (200 ms, something like that)
// TODO(urgent): add env variable for default subapp?
// TODO(urgent): add view of currently-loaded dbs, and option to clear cache or pre-load other apps?
// TODO(urgent): determine why a hard-reset is needed for app change, and why taigi.us is ignoring app
// TODO(urgent): don't require final.json for tests to work? how? webpack? do split up apps, so that a change to a single yaml doesn't always trigger a rebuild of the single final json?
// TODO(urgent): fix double-fetching of csvs in test mode (and check that it's not happening in prod)
// TODO(urgent): finish implementing subapps/views (to allow for e.g. eng-poj). next: switcher. first commit with eng_poj hardcoded.
// TODO(urgent): unit test subapps/views. do not submit until unit tests are functional (and maybe subapp id is no longer an optional flag everywhere, since that causes issues with calls)
// TODO(urgent): implement language/view selection (probably through views, "blacklistFieldsByView:" or such, or maybe "blacklistLanguagesByView", something like that
// TODO(urgent): have build happen on AWS/etc by default (use webpack to turn yaml into json and then combine the jsons)
// TODO(urgent): fix link display in about page on nexus 5
// TODO(urgent): add a contact page for ChhoeTaigi
// TODO(urgent): integration tests, new unit tests for recently-added classes
// TODO(urgent): more consistent caching/loading of fonts (host locally? how will that affect hosting bandwidth?). because all fonts aren't loaded, people without the correct fonts on their system *will not be able to see many characters* during dynamic loading
// TODO(urgent): error messages for if offline and no cache
// TODO(urgent): move dbs into sub-repository?
// TODO(urgent): have zod do existence checks / warnings on CSVs: do they exist, are they smaller than 10MB
// TODO(urgent): debug service worker not working locally (is this still happening?)
// TODO(high): mag glass clickable menu. affordances for whether or not a searcher is online or offline. if online, aff. of whether it is available, if offline, aff. of whether it is cached/ready
// TODO(high): update web_accessible_resources in manifest.json
// TODO(high): background color hex code available as an option for a db? or field? or language?
// TODO(high): use CRACO or similar to allow for using webpack plugins
// TODO(high): determine which fields to make searchable in in ~/Liburry/src/config/apps/taigi.us/db.yml
// TODO(high): let each db config specify the number of workers to spawn off for each db, or the max number of entries per worker, then have each worker be a sub-worker of a controlling worker per db. something like that...
// TODO(high): change server script to also generate normalized_other
// TODO(high): debug why autofocus doesn't work on incognito mode (is that normal, or just specific to this? most likely the second, and has to do with timing.)
// TODO(high): help page. taigi help page should mention nospaces, input beh8, hanji, english, etc
// TODO(high): see if poj_normalized can be committed upstream
// TODO(high): catch/fatalError on any critical path async functions in searchController / etc
// TODO(high): figure out the easiest/simplest/best place to have a simple support forum (github?)
// TODO(high): "X" for search results
// TODO(high): create a contact email
// TODO(high): change chha/taigi to liburry in code / github
// TODO(high): move config directory to src/, since it no longer needs to be public
// TODO(high): use json imports instead of fetch/local load, and have watchman behavior for ymls to regenerate the json (in src) (aka, use yaml-loader (will require ejecting, or using react-app-rewired))
// TODO(high): have loading bar float with the searchbar (will need a padding element which disappears at the same speed)
// TODO(high): don't require a double-back right after submit
// TODO(high): handle "-", "?", etc entries in KamJitian (make blankOutFieldsMatching)
// TODO(high): include link to: https://www.zeczec.com/projects/taibun-kesimi / https://www.zeczec.com/projects/taibun-kesimi/orders/back_project#_=_
// TODO(high): look into strange behavior of fuzzysort mark generation (did it work before and broke recently, or was it always broken? - try "alexander")
// TODO(high): different debug levels, possibly use an upstream lib for logging
// TODO(high): always change url to be unicoded, so e.g. google meet won't butcher https://taigi.us/#mode=SEARCH;q=chhù-chú
// TODO(high): spyon test that console.log isn't called in an integration test
// TODO(high): search without diacritics, spaces, or hyphens, then remove duplicates?
// TODO(high): test performance of compressing/decompressing json/csv files
// TODO(high): fix link preview on LINE
// TODO(high): change the page title using JS (so each app can have its own title) (can different apps have different manifest.json?)
// TODO(high): more evenly spread work among the workers (giku is much smaller than mk, etc)
//             have generated CSVs include the dbname for each entry? or set it when pulling in from papaparse?
// TODO(high): more evenly split the work between large/small databases, and possibly return results immediately and batch renders
// TODO(high): implement select bar
// TODO(high): chase down error causing duplicate search entries
// TODO(high): create side box for dbname/alttext/etc, differentiate it with vertical line?
// TODO(high): better styling, fewer borders
// TODO(high): "click to update" PWA link (see WhatsApp)
// TODO(high): fix integration tests: https://stackoverflow.com/questions/42567535/resolving-imports-using-webpacks-worker-loader-in-jest-tests
// TODO(high): decide how to handle hoabun vs taibun, settings for display
// TODO(high): show/search typing input
// TODO(high): make fonts bigger across the board
// TODO(high): let hyphens and spaces be interchangeable in search
// TODO(high): determine why duplicate search results are sometimes returned (see "a" results for giku)
// TODO(high): fix icon sizes/manifest: https://github.com/facebook/create-react-app/blob/master/packages/cra-template/template/public/manifest.json (both ico and icon)
// TODO(high): handle alternate spellings / parentheticals vs separate fields
// TODO(high): handle explanation text (see "le" in Giku)
// TODO(high): Fix clipboard notif not working on most browsers
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): create an index of all 3 categories combined, and search that as text?
// TODO(high): let spaces match hyphens and vice-versa
// TODO(high): investigate more performant search solutions (lunr, jssearch, etc)
// TODO(high): benchmark, evaluate search/render perf, especially with multiple databases
// TODO(high): keyboard shortcuts
// TODO(mid): see why double-search is happening locally (most likely safemode)
// TODO(mid): with fuzzysort, just ignore dashes and spaces? or search once with them included and once without?
// TODO(mid): try out https://github.com/nol13/fuzzball.js
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
// TODO(low): delimiter can be affected by <mark> placement if it's able to be searched
// TODO(low): use magnifying glass for selecting searcher type, with different icon for each searcher and a language-enabled dropdown menu for the different Searcher options
// TODO(low): fix burger menu location not changing when bar is loading (can't use absolute position, need to use fixed and change top)
// TODO(low): only show border around title/name when there are multiple (or put border between them, or show them on separate lines)
// TODO(low): localization for links, about section, etc
// TODO(low): localization for og:description etc, and/or alternates
// TODO(low): better color for manifest.json theme
// TODO(low): in db load indicator, have a separate icon for downloading and loading
// TODO(low): font size button
// TODO(low): locally-stored settings, or users
// TODO(low): abstract away searching logic to avoid too much fuzzysort-specific code
// TODO(low): configurable searches (exact search, slow but better search, etc)
// TODO(low): notify when DBs fail to load
// TODO(low): radio buttons of which text to search
// TODO(low): hoabun text click should copy hoabun?
// TODO(low): link preview image
// TODO(low): title/main page
// TODO(low): copyright, links, etc
// TODO(low): settings
// TODO(low): fix the default/preview text
// TODO(low): check web.dev/measure
// TODO(low): 'X' button for clearing search (search for an svg)
// TODO(low): replicate "cannot read property dbName" of null race condition
// TODO(low): install button in settings page
// TODO(low): incorrect behavior of search box when using back/forward in browser
// TODO(low): have display results limit be part of options, and pass it around for use where it's needed
// TODO(low): take a nap
// TODO(wishlist): config creation via a page (which has fields for the various input types based on zod shape, and has client-side validation of inputs (generate a tree, allow the user to populate with the correct values, constantly run zod on input and show errors hovered by the path from the error)
// TODO(wishlist): keyboard shortcuts, esp for "highlight search"
// TODO(wishlist): custom actions for particular results (how would these be defined? how could they be specified in configs?)
// TODO(wishlist): google translate link
// TODO(wishlist): real download progress: https://usefulangle.com/post/74/javascript-dynamic-font-loading
// TODO(wishlist): non-javascript support?
// TODO(wishlist): dark and light themes
// TODO(wishlist): engaging buttons - random words, random search, etc
// TODO(wishlist): typing / sentence construction mode. clicking a sentence/word adds it to a list, and clicking on it in that list deletes it (or selects it for replacement?)
// TODO(wishlist): "lite" version speaking out to server for searches (AbortController to help with cancelation)
// TODO(later): use leafletjs to create a map aggregation mode
// TODO(later): mailing list / forum
// TODO(later): homepage
// TODO(later): homepage WOTD
// TODO(later): "show me random words"
// TODO(later): "show me words of this particular word type" (see "abbreviations" field in embree)
// TODO(later): use embree noun classifier / word type in other dbs
// TODO(later): include soatbeng/explanations
// TODO(later): include alternates (very hard with maryknoll)
// TODO(later): remove parentheticals from maryknoll entries
// TODO(later): word similarity analysis, link to similar/possibly-related words (this could be added to the CSVs)
// TODO(later): allow for entries to be marked incomplete/broken
// TODO(later): link to ChhoeTaigi for entries
// TODO(later): cross-reference noun classifiers across DBs (and noun status)
// TODO(later): accessibility? what needs to be done? link to POJ screen readers?
// TODO(later): store options between sessions
// TODO(later): run a spellchecker on "english"
// TODO(later): WASM fast search
// TODO(later): browser omnibar tab search (register as search engine)
// TODO(later): setTimeout for search / intensive computation? (in case of infinite loops) (ensure warn on timeout)
// TODO(later): create an app in example/, and have that be the default app
// TODO(maybe): install a router library for handling e.g. playground
// TODO(maybe): markdown home pages?
// TODO(maybe): allow results to hint/override where particular columns should be displayed? or a way to query server/file per db?
// TODO(other): reclassify maryknoll sentences as examples? or just as not-words?
// TODO(other): reclassify maryknoll alternates, possibly cross-reference most taibun from others into it?
// TODO(think): is there a privacy-safe way to log exceptions? maybe ask hacker news, or do some searching?
//
// Posts:
// [] Forumosa
// [] Taigi Discord
// [] /r/ohtaigi
// [] HN
//
// https://twblg.dict.edu.tw/holodict_new/mobile/result_detail.jsp?n_no=11235&curpage=1&sample=%E9%A4%85&radiobutton=1&querytarget=1&limit=50&pagenum=1&rowcount=25
//
// Project: non-fuzzysort search
//      1) DONE: create a Searcher interface to abstract away the direct reliance on fuzzysort in the workers
//      2) DONE: find a suitably simple alternative to test, and implement Searcher for it
//      3) remove remaining reliance on fuzzy variables (note debug mode score threshold - which is hard for lunr, since BM25 is not normalized)
//      4) test out lovefield, lunr.js [DONE], fuzzball, and js-search
//
// Project: Integration tests
//      1) DONE: Determine how to mock
//      2) DONE: Mock out calls to search worker initialization
//      3) DONE: Simulate worker responses, if possible. If not, set fake results directly.
//      4) Test for the display of:
//          a) DONE: entries, when results are populated
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
//      2) DONE: create more flexible data structure
//      3) DONE(ish): handle poj_normalized and kip_normalized
//
//      4) DONE: Add configuration for all
//         4) create a better config format (yaml?)
//      5) note (in configuration) which text an alt text is for?
//      6) regenerate fuzzy index (and lunr?) on the fly when objects change
//      7) test performance
//      8) create settings page with language toggle?

export interface ChhaTaigiProps {
    rfc: ReturnedFinalConfig,
    // TODO: always annotate results with the current displaytype's info (one re-search when you change displaytype is well worth being able to calculate before render time (preferably in another thread))
    mockOptions?: OptionsChangeableByUser,
    mockResults?: AnnotatedPerDictResults,
    updateDisplayForDBLoadEvent?: (dbStatus: AllDBLoadStats | {didReload: true}) => void,
    updateDisplayForSearchEvent?: (searchContext: SearchContext | null) => void,
};

export interface ChhaTaigiState {
    options: OptionsChangeableByUser,
    resultsHolder: SearchResultsHolder,
}

export type GetMainState = () => ChhaTaigiState;
export type SetMainState = (state: Partial<ChhaTaigiState> | ((prevState: ChhaTaigiState) => any)) => void;

export class ChhaTaigi extends React.Component<ChhaTaigiProps, ChhaTaigiState> {
    private qs = new QueryStringHandler();

    private currentMountAttempt = 0;
    searchBar: React.RefObject<SearchBar>;
    console: StubConsole;
    newestQuery: string;
    appConfig: AppConfig;

    // This should always be set, but TypeScript isn't quite smart enough to know
    // that startSearchController sets it for us
    searchController: SearchController | undefined;

    constructor(props: ChhaTaigiProps) {
        super(props);

        const options = this.props.mockOptions ?? this.qs.parse();

        this.appConfig = AppConfig.from(this.props.rfc, options.appID ?? LIBURRY_DEFAULT_APP, options.subAppID);

        this.state = {
            options,
            resultsHolder: new SearchResultsHolder(),
        };

        this.newestQuery = this.state.options.savedQuery;

        // Miscellaneous object initialization
        this.console = getDebugConsole(this.state.options.debug);
        this.searchBar = React.createRef();

        // Bind functions
        this.getAppSelector = this.getAppSelector.bind(this);
        this.getCurrentMountAttempt = this.getCurrentMountAttempt.bind(this);
        this.getEntryComponents = this.getEntryComponents.bind(this);
        this.getNewestQuery = this.getNewestQuery.bind(this);
        this.getStateTyped = this.getStateTyped.bind(this);
        this.hashChange = this.hashChange.bind(this);
        this.handleAppChange = this.handleAppChange.bind(this);
        this.handleSubAppChange = this.handleSubAppChange.bind(this);
        this.loadPage = this.loadPage.bind(this);
        this.goHome = this.goHome.bind(this);
        this.mainDisplayArea = this.mainDisplayArea.bind(this);
        this.overrideResultsForTests = this.overrideResultsForTests.bind(this);
        this.saveNewestQuery = this.saveNewestQuery.bind(this);
        this.searchQuery = this.searchQuery.bind(this);
        this.setStateTyped = this.setStateTyped.bind(this);
        this.startSearchController = this.startSearchController.bind(this);
        this.subscribeHash = this.subscribeHash.bind(this);
        this.unsubscribeHash = this.unsubscribeHash.bind(this);
        this.updateSearchBar = this.updateSearchBar.bind(this);

        this.startSearchController();

        // Allow for overriding results from Jest.
        this.overrideResultsForTests();
    }

    startSearchController() {
        const {getStateTyped, setStateTyped, getNewestQuery, appConfig} = this;
        const {updateDisplayForDBLoadEvent, updateDisplayForSearchEvent} = this.props;
        const {debug} = this.state.options;

        this.searchController = new SearchController({
            debug,
            getStateTyped,
            setStateTyped,
            getNewestQuery,
            appConfig,
            updateDisplayForDBLoadEvent,
            updateDisplayForSearchEvent,
        });

        return this.searchController;
    }

    getNewestQuery() {
        return this.newestQuery;
    }

    setNewestQuery(query: string) {
        this.newestQuery = query;
    }

    getCurrentMountAttempt() {
        return this.currentMountAttempt;
    }

    overrideResultsForTests() {
        const {mockResults} = this.props;
        if (runningInJest() && mockResults !== undefined) {
            this.state.resultsHolder.addResults(mockResults);
        }
    }

    setStateTyped(state: Partial<ChhaTaigiState> | ((prevState: ChhaTaigiState) => any)) {
        // @ts-ignore - Partial seems to work fine, why does Typescript complain?
        this.setState(state)
    }

    // TODO: get rid of this now that state is typed?
    getStateTyped(): ChhaTaigiState {
        return this.state as ChhaTaigiState;
    }

    componentDidMount() {
        const {options} = this.getStateTyped();
        this.console.time("mountToAllDB");

        // TODO: does this need to happen here? can we just start a search?
        this.updateSearchBar(this.getNewestQuery());

        const savedMountAttempt = this.currentMountAttempt;

        // Waiting breaks MountUnmount tests, so don't setTimeout in tests
        const protecc = runningInJest() ? (f: Function) => f() : setTimeout;

        // Wait a millisecond to check that this is actually the final mount attempt
        // (prevents double-loading DBs on localhost)
        protecc(() => {
            if (this.currentMountAttempt === savedMountAttempt) {
                this.searchController?.startWorkersAndListener(options.searcherType);
                this.subscribeHash();
                const fontLoader = getFontLoader(this.appConfig);
                fontLoader.load();
            } else {
                console.warn("Detected double-mount, not starting workers...");
            }
        }, 1);
    }

    componentWillUnmount() {
        this.currentMountAttempt += 1;
        this.unsubscribeHash();
        this.searchController?.cleanup();
    }

    // These two are their own functions to allow visibility from Jest
    subscribeHash() {
        window.addEventListener("hashchange", this.hashChange);
    }
    unsubscribeHash() {
        window.removeEventListener("hashchange", this.hashChange);
    }

    // Whenever the hash changes, check if a new search should be triggered, and
    // update changed options in state.
    hashChange(_evt: Event) {
        const oldQuery = this.getNewestQuery();
        const newOptions = this.qs.parse();
        const newQuery = newOptions.savedQuery;

        if (newQuery !== oldQuery) {
            this.updateSearchBar(newQuery);
            this.searchQuery(newQuery);
        }

        this.setStateTyped({options: newOptions});
    }

    async restartSearchController() {
        this.props.updateDisplayForDBLoadEvent?.({didReload: true});
        this.props.updateDisplayForSearchEvent?.(null);
        this.searchController?.cleanup()
            .then(this.startSearchController)
            .then((sc) => sc.startWorkersAndListener(this.state.options.searcherType));
    }

    handleAppChange(appID: AppID) {
        this.appConfig = AppConfig.from(this.props.rfc, appID, undefined);
        this.restartSearchController();
        this.qs.setApp(appID);
        if (this.appConfig.subAppID !== undefined) {
            this.qs.setSubApp(this.appConfig.subAppID);
        } else {
            this.qs.clearSubApp();
        }
    }

    handleSubAppChange(subAppID: SubAppID) {
        this.appConfig = AppConfig.from(this.props.rfc, this.appConfig.appID, subAppID);
        this.restartSearchController();
        this.qs.setSubApp(subAppID);
    }

    setMode(mode: MainDisplayAreaMode) {
        if (mode !== MainDisplayAreaMode.PAGE) {
            this.clearPage();
        }
        this.setStateTyped((state) => ({options: {...state.options, mainMode: mode}}));
        this.qs.setMode(mode);
    }

    updateSearchBar(query: string) {
        if (this.searchBar.current) {
            this.searchBar.current.updateAndFocus(query);
        }
    }

    // TODO: this should give some visual indication of the saved search
    // TODO: this should happen after a timeout when the user stops typing
    saveNewestQuery() {
        const query = this.newestQuery;
        this.setStateTyped((state) => ({options: {...state.options, savedQuery: query}}));
        this.qs.saveQuery(query);
    }

    searchQuery(query: string) {
        this.searchController?.search(query);
        this.setNewestQuery(query);

        this.qs.updateQueryWithoutHistoryChange(query);

        this.setMode(
            query ?
                MainDisplayAreaMode.SEARCH :
                MainDisplayAreaMode.DEFAULT);

    }

    getEntryComponents(): JSX.Element {
        const {resultsHolder, options} = this.getStateTyped();
        const entries = resultsHolder.getAllResults();

        const entryContainers = entries.map((entry) =>
            <AgnosticEntryContainer
                debug={options.debug}
                entry={entry}
                blacklistDialectsRegex={this.appConfig.getDialectBlacklistRegex()}
                key={entry.getDisplayKey()} />
        );

        return <>{entryContainers}</>;
    }

    getAppSelector() {
        return <AppSelector
            rfc={this.props.rfc}
            currentAppID={this.appConfig.appID}
            currentSubAppID={this.appConfig.subAppID}
            handleAppChange={this.handleAppChange}
            handleSubAppChange={this.handleSubAppChange}
        />;
    }

    mainDisplayArea(mode: MainDisplayAreaMode): JSX.Element {
        switch (mode) {
            case MainDisplayAreaMode.PAGE:
                const {pageID} = this.state.options;
                if (pageID !== null) {
                    return <CombinedPageElement perAppPages={this.appConfig.pageHandler.getPagesForPageID(pageID)} />
                } else {
                    return this.mainDisplayArea(MainDisplayAreaMode.DEFAULT);
                }
            case MainDisplayAreaMode.SEARCH:
                return this.getEntryComponents();
            case MainDisplayAreaMode.DEFAULT:
                return <></>;
        }
    }

    loadPage(pageID: PageID) {
        // NOTE: this will probably cause a double-render - setMode should probably be changed
        this.setStateTyped((state) => ({options: {...state.options, pageID}}));
        this.setMode(MainDisplayAreaMode.PAGE);
        this.qs.setPage(pageID);
    }

    clearPage() {
        this.setStateTyped((state) => ({options: {...state.options, pageID: null}}));
        this.qs.clearPage();
    }

    goHome() {
        this.setMode(this.getNewestQuery() ?
            MainDisplayAreaMode.SEARCH :
            MainDisplayAreaMode.DEFAULT)
    }

    render() {
        const {options} = this.getStateTyped();

        // NOTE: it will be very nice to be able to change the apps while searches are typed, but you'll need to clear the existing search
        //       each time app or subapp changes (otherwise, things stick around and change based on what you switch to)
        return (
            <div className="ChhaTaigi">
                <SearchBar
                    appConfig={this.appConfig}
                    ref={this.searchBar}
                    searchQuery={this.searchQuery}
                    saveNewestQuery={this.saveNewestQuery}
                    loadPage={this.loadPage}
                    goHome={this.goHome}
                />
                {this.getAppSelector()}
                {this.mainDisplayArea(options.mainMode)}
            </div>
        );
    }
}
