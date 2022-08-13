import * as React from "react";

import AgnosticEntryContainer from "./entry_containers/AgnosticEntryContainer";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import QueryStringHandler, {QSUpdateOpts} from "./QueryStringHandler";
import SearchController from "./search/orchestration/SearchController";
import SearchResultsHolder from "./search/orchestration/SearchResultsHolder";

import getDebugConsole, {StubConsole} from "./getDebugConsole";
import {AllDBLoadStats, AnnotatedPerDictResults} from "./types/dbTypes";
import {CombinedPageElement} from "./pages/Page";
import {MainDisplayAreaMode} from "./types/displayTypes";
import {SearchBar} from "./components/SearchBar";
import {setTimeoutButNotInProdOrTests, getRecordEntries, runningInJest} from "./utils";
import AppConfig from "./configHandler/AppConfig";
import SearchOptionsArea from "./searchOptions/SearchOptionsArea";
import {KnownDialectID} from "../common/generatedTypes";
import AppSelector from "./searchOptions/AppSelector";

import type {SearchContext} from "./search/orchestration/SearchValidityManager";
import type {AppID, PageID, ReturnedFinalConfig, SubAppID} from "./configHandler/zodConfigTypes";

import "./ChhaTaigi.css";

// TODO: fix skipped tests in src/client/ChhaTaigi.test.tsx
// TODO: set default display language per-app in build.yml
// TODO: make clicking on search bar close dialogue windows
// TODOs are here: https://docs.google.com/spreadsheets/d/1lvbgLRRxGiNIf2by_mMW0aJrP1uhYTsz4_I4vmrB_Ss/edit?usp=sharing
//
// Posts:
// [] Forumosa
// [] Taigi Discord
// [] /r/ohtaigi
// [] HN
// [] aiong, podcasters, chhoetaigi folks, etc
//
// https://twblg.dict.edu.tw/holodict_new/mobile/result_detail.jsp?n_no=11235&curpage=1&sample=%E9%A4%85&radiobutton=1&querytarget=1&limit=50&pagenum=1&rowcount=25

export interface ChhaTaigiProps {
    rfc: ReturnedFinalConfig,

    // This can be passed in so that it can be accessed in tests.
    qs?: QueryStringHandler,

    // TODO: always annotate results with the current displaytype's info (one re-search when you change displaytype is well worth being able to calculate before render time (preferably in another thread))
    mockOptions?: OptionsChangeableByUser,
    mockResults?: AnnotatedPerDictResults,
    genUpdateDisplayForDBLoadEvent?: (dbStatus: AllDBLoadStats | {didReload: true}) => Promise<void>,
    genUpdateDisplayForSearchEvent?: (searchContext: SearchContext | null) => Promise<void>,
    getProgressBars?: (parentElem: React.RefObject<HTMLElement>) => JSX.Element,
}

export interface ChhaTaigiState {
    options: OptionsChangeableByUser,
    resultsHolder: SearchResultsHolder,
    isTyping: boolean,
    visibleMenu: VisibleMenu | null,
}

export enum VisibleMenu {
    SearchOptions,
    DialectSwitcher,
}

type Timer = ReturnType<typeof setTimeout>;
const TYPING_TIMEOUT_MS = 1000;

export class ChhaTaigi extends React.Component<ChhaTaigiProps, ChhaTaigiState> {
    private currentMountAttempt = 0;

    private qs: QueryStringHandler;
    searchOptionsAreaRef: React.RefObject<HTMLDivElement>;
    searchBarRef: React.RefObject<SearchBar>;
    queryStringHandlerRef: React.RefObject<QueryStringHandler>;
    console: StubConsole;
    newestQuery: string;
    appConfig: AppConfig;
    typingTimerIDs: ReturnType<typeof setTimeout>[] = []; // Object to satisfy Node typing
    searchController: SearchController;

    constructor(props: ChhaTaigiProps) {
        super(props);

        this.qs = this.props.qs ?? new QueryStringHandler();
        const options = this.props.mockOptions ?? this.qs.parse();

        // TODO: propagate changes to the config to State?
        this.appConfig = AppConfig.from(this.props.rfc, options);

        this.state = {
            options,
            resultsHolder: new SearchResultsHolder(),
            isTyping: false,
            visibleMenu: null,
        };

        this.newestQuery = this.state.options.savedQuery;

        // Miscellaneous object initialization
        this.console = getDebugConsole(this.state.options.debug);
        this.searchBarRef = React.createRef();
        this.searchOptionsAreaRef = React.createRef();
        this.queryStringHandlerRef = React.createRef();

        // Bind functions
        this.closeVisibleMenu = this.closeVisibleMenu.bind(this);
        this.genAddResultsCallback = this.genAddResultsCallback.bind(this);
        this.genClearResultsCallback = this.genClearResultsCallback.bind(this);
        this.genRestartSearchController = this.genRestartSearchController.bind(this);
        this.genUpdateQs = this.genUpdateQs.bind(this);
        this.getCurrentMountAttempt = this.getCurrentMountAttempt.bind(this);
        this.getDefaultDisplayArea = this.getDefaultDisplayArea.bind(this);
        this.getEntryComponents = this.getEntryComponents.bind(this);
        this.getMainDisplayAreaContents = this.getMainDisplayAreaContents.bind(this);
        this.getNewestQuery = this.getNewestQuery.bind(this);
        this.getPageView = this.getPageView.bind(this);
        this.goHome = this.goHome.bind(this);
        this.handleAppChange = this.handleAppChange.bind(this);
        this.handleDialectChange = this.handleDialectChange.bind(this);
        this.handleSubAppChange = this.handleSubAppChange.bind(this);
        this.hashChange = this.hashChange.bind(this);
        this.loadPage = this.loadPage.bind(this);
        this.overrideResultsForTests = this.overrideResultsForTests.bind(this);
        this.searchQuery = this.searchQuery.bind(this);
        this.startSearchController = this.startSearchController.bind(this);
        this.subscribeHash = this.subscribeHash.bind(this);
        this.toggleVisibleMenu = this.toggleVisibleMenu.bind(this);
        this.unsubscribeHash = this.unsubscribeHash.bind(this);
        this.updateSearchBar = this.updateSearchBar.bind(this);

        this.searchController = this.startSearchController();

        // Allow for overriding results from Jest.
        this.overrideResultsForTests();
    }

    startSearchController() {
        const {genAddResultsCallback, genClearResultsCallback, getNewestQuery, appConfig} = this;
        const {genUpdateDisplayForDBLoadEvent, genUpdateDisplayForSearchEvent} = this.props;
        const {debug} = this.state.options;

        return new SearchController({
            debug,
            genAddResultsCallback,
            genClearResultsCallback,
            getNewestQuery,
            appConfig,
            genUpdateDisplayForDBLoadEvent,
            genUpdateDisplayForSearchEvent,
        });
    }

    // NOTE: this doesn't seem great. Should resultsholder really be living in state?
    // Or should state just have a "resultsreceivedandreadyfordisplayupdate" or something equivalent?
    async genAddResultsCallback(results: AnnotatedPerDictResults) {
        this.state.resultsHolder.addResults(results);
        this.setState({});
    }

    async genClearResultsCallback() {
        this.state.resultsHolder.clear();
        this.setState({});
    }

    async genRestartSearchController() {
        this.props.genUpdateDisplayForDBLoadEvent?.({didReload: true});
        this.props.genUpdateDisplayForSearchEvent?.(null);

        // The order of these operations, and the await on cleanup, are all important to avoid
        // memory leaks and/or strange behavior.
        await this.searchController?.cleanup();
        this.searchController = this.startSearchController();
        this.searchController.startWorkersAndListener(this.state.options.searcherType)
    }

    getNewestQuery() {
        return this.newestQuery;
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

    componentDidMount() {
        const {options} = this.state;
        const {appID, dialectID} = this.appConfig;
        this.console.time("mountToAllDB");

        // TODO: does this need to happen here? can we just start a search?
        this.updateSearchBar(this.getNewestQuery());

        const savedMountAttempt = this.currentMountAttempt;

        // Waiting breaks MountUnmount tests, so don't setTimeout in tests
        const protecc = setTimeoutButNotInProdOrTests();
        const msToWaitInDevMode = 10;

        // Wait for check that this is actually the final mount attempt
        // (prevents double-loading DBs on localhost, since dev mode often double-mounts)
        protecc(async () => {
            if (this.currentMountAttempt === savedMountAttempt) {
                this.searchController?.startWorkersAndListener(options.searcherType);
                this.subscribeHash();
                this.appConfig.fontLoader.load(appID, dialectID);
                this.qs.anchor();
            } else {
                console.warn("Detected double-mount, not starting workers...");
            }
        }, msToWaitInDevMode);
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

        this.setState({options: newOptions});
    }

    async genUpdateQs(
        updates: Partial<OptionsChangeableByUser>,
        queryStringOpts?: QSUpdateOpts,
        frontendOpts?: {skipStateUpdate?: boolean}
    ) {
        const {mainMode} = updates;
        if (mainMode !== undefined) {
            // Clear pageID in options and the querystring if it isn't specified
            if (mainMode !== MainDisplayAreaMode.PAGE && this.state.options.pageID !== undefined) {
                updates.pageID = undefined;
            }
        }

        this.qs.update(updates, queryStringOpts);

        if (!frontendOpts?.skipStateUpdate) {
            this.setState((state) => ({options: {...state.options, ...updates}}));
        }
    }

    handleAppChange(appID: AppID) {
        const {dialectID} = this.appConfig;
        // NOTE: We reset subapp id on app change.
        this.appConfig = AppConfig.from(this.props.rfc, {appID, dialectID});
        const {subAppID} = this.appConfig;
        this.genRestartSearchController();
        this.genUpdateQs({appID, subAppID});
        this.appConfig.fontLoader.load(appID, dialectID);
    }

    handleSubAppChange(subAppID: SubAppID) {
        const {appID, dialectID} = this.appConfig;
        this.appConfig = AppConfig.from(this.props.rfc, {appID, subAppID, dialectID});
        this.genRestartSearchController();
        this.genUpdateQs({subAppID});
        this.appConfig.fontLoader.load(appID, dialectID);
    }

    handleDialectChange(dialectID: KnownDialectID) {
        const {appID, subAppID} = this.appConfig;
        this.appConfig = AppConfig.from(this.props.rfc, {appID, subAppID, dialectID});
        // NOTE: dialect changes currently do not have any effect on searches.
        //this.genRestartSearchController();

        this.appConfig.i18nHandler.changeDialect(dialectID);
        this.genUpdateQs({dialectID});
        this.appConfig.fontLoader.load(appID, dialectID);
    }

    updateSearchBar(query: string) {
        this.searchBarRef.current?.updateAndFocus(query);
    }

    // TODO: check back button behavior in a unit test? is that possible? or would it need to be in an integration test?
    async searchQuery(query: string, opts?: {isFromUserTyping: boolean}) {
        this.searchController?.search(query);

        const mainMode = query
            ? MainDisplayAreaMode.SEARCH
            : MainDisplayAreaMode.DEFAULT;

        const oldMode = this.state.options.mainMode;
        const modeChange = oldMode !== mainMode;

        this.newestQuery = query;

        if (opts?.isFromUserTyping) {
            // Clear old timers in an async-safe way
            while (this.typingTimerIDs.length !== 0) {
                const oldTimerID = this.typingTimerIDs.shift();
                clearTimeout(oldTimerID as Timer);
            }

            const typingTimerID = setTimeout(() => {this.setState({isTyping: false})}, TYPING_TIMEOUT_MS);
            this.typingTimerIDs.push(typingTimerID);

            const modifyHistInPlace = this.state.isTyping;
            this.setState({isTyping: true});

            this.genUpdateQs({savedQuery: query, mainMode}, {modifyHistInPlace}, {skipStateUpdate: !modeChange});
        } else {
            if (modeChange) {
                this.setState((state) => ({options: {...state.options, mainMode}}));
            }
        }
    }

    getEntryComponents(): JSX.Element {
        const {resultsHolder, options} = this.state;
        const entries = resultsHolder.getAllResults();

        const entryContainers = entries.map((entry) => {
            const dbConfig = this.appConfig.dbConfigHandler.getConfig(entry.getDBIdentifier());
            // TODO: log an error if dbConfig is null here?
            const displayableFields = dbConfig?.getDisplayableFieldIDs() ?? new Set();
            return <AgnosticEntryContainer
                debug={options.debug}
                entry={entry}
                displayableFields={displayableFields}
                key={entry.getDisplayKey()} />
        });

        return <>{entryContainers}</>;
    }

    getPageView(): JSX.Element {
        const {pageID} = this.state.options;
        if (pageID !== undefined) {
            return <CombinedPageElement rfc={this.props.rfc} perAppPages={this.appConfig.pageHandler.getPagesForPageID(pageID)} />
        } else {
            return this.getMainDisplayAreaContents(MainDisplayAreaMode.DEFAULT);
        }
    }

    getDefaultDisplayArea() {
        const {appID, subAppID} = this.appConfig;
        const {tok} = this.appConfig.i18nHandler;
        const appSelector = <AppSelector
                rfc={this.props.rfc}
                currentAppID={appID}
                currentSubAppID={subAppID}
                handleAppChange={this.handleAppChange}
                handleSubAppChange={this.handleSubAppChange}
                i18nHandler={this.appConfig.i18nHandler}
            />
        return <div className="liburry-default-display-area">
            {tok("welcome_message")}
            <div className="liburry-default-display-area-app-selector"></div>
            {appSelector}
        </div>
    }

    getMainDisplayAreaContents(mode: MainDisplayAreaMode): JSX.Element {
        switch (mode) {
            case MainDisplayAreaMode.PAGE:
                return this.getPageView();
            case MainDisplayAreaMode.SEARCH:
                return this.getEntryComponents();
            case MainDisplayAreaMode.DEFAULT:
                return this.getDefaultDisplayArea();
        }
    }

    getSearchBarPlaceholderText(): string {
        // TODO: memoize based on the combination of app+subapp+dialect. Make this a component?
        const allEnabledDBs = this.appConfig.dbConfigHandler.getAllEnabledDBConfigs();
        const knownDialectsForDBs = allEnabledDBs.map((dbConf) => dbConf.getKnownDialectIDsForSearchableFields()).flat();
        const frequencies: Partial<Record<KnownDialectID, number>> = {};
        knownDialectsForDBs.forEach((dialectID) => {
            const pastFreq = frequencies[dialectID];
            frequencies[dialectID] = pastFreq !== undefined ? pastFreq + 1 : 1;
        });
        const sortedFreq = getRecordEntries(frequencies).sort((a, b) => b[1] - a[1]);
        const allSearchableKnownDialectsForThisSearch = sortedFreq.map((x) => x[0] as KnownDialectID);
        if (allSearchableKnownDialectsForThisSearch.length > 0) {
            const searchPhrases = allSearchableKnownDialectsForThisSearch.map((dialectID) => this.appConfig.i18nHandler.tokForDialect_RAWSTRING("search", dialectID));
            return searchPhrases.join(" / ");
        } else {
            return this.appConfig.i18nHandler.tok_RAWSTRING("search");
        }
    }

    loadPage(pageID: PageID) {
        this.genUpdateQs({mainMode: MainDisplayAreaMode.PAGE, pageID}, {modifyHistInPlace: true});
    }

    goHome() {
        const mainMode = this.getNewestQuery() ?
            MainDisplayAreaMode.SEARCH :
            MainDisplayAreaMode.DEFAULT;
        this.genUpdateQs({mainMode}, {modifyHistInPlace: true})
    }

    toggleVisibleMenu(targetMenu: VisibleMenu) {
        const currentlyVisibleMenu = this.state.visibleMenu;
        this.setState({visibleMenu: currentlyVisibleMenu === targetMenu ? null : targetMenu})
    }

    closeVisibleMenu() {
        this.setState({visibleMenu: null})
    }

    render() {
        const {options, visibleMenu} = this.state;
        const {mainMode} = options;
        const {searchBarRef} = this;

        const mainAreaContents = this.getMainDisplayAreaContents(mainMode);

        const searchBarPlaceholderText = this.getSearchBarPlaceholderText();

        // TODO: fix styling on searchbar (border-radius, better border-ish color)
        // TODO: get rid of react-burger-menu, use modal
        return <div className="ChhaTaigi">
            <SearchOptionsArea
                rfc={this.props.rfc}
                appConfig={this.appConfig}
                handleAppChange={this.handleAppChange}
                handleSubAppChange={this.handleSubAppChange}
                searchOptionsVisible={visibleMenu === VisibleMenu.SearchOptions}
                searchBarRef={searchBarRef}
                closeSearchOptionsArea={this.closeVisibleMenu}
                i18nHandler={this.appConfig.i18nHandler}

                currentSearcherType={options.searcherType}
                handleSearcherTypeChange={async (searcherType) => {await this.genUpdateQs({searcherType}); this.genRestartSearchController()}}
            />

            <SearchBar
                appConfig={this.appConfig}
                ref={this.searchBarRef}
                searchQuery={this.searchQuery}
                clearQuery={() => {this.searchQuery(""); this.updateSearchBar("");}}
                getNewestQuery={this.getNewestQuery}
                loadPage={this.loadPage}
                goHome={this.goHome}
                toggleVisibleMenu={this.toggleVisibleMenu}
                getProgressBars={this.props.getProgressBars}
                placeholderText={searchBarPlaceholderText}

                i18nHandler={this.appConfig.i18nHandler}
                currentDialectID={options.dialectID}
                onDialectSwitch={this.handleDialectChange}
            />
            <div className="liburry-main-area" >
                {mainAreaContents}
            </div>
        </div>
    }
}
