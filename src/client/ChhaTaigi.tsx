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
import {getProtecc, runningInJest} from "./utils";
import AppConfig from "./configHandler/AppConfig";

import type {SearchContext} from "./search/orchestration/SearchValidityManager";
import type {AppID, PageID, ReturnedFinalConfig, SubAppID} from "./configHandler/zodConfigTypes";
import AppSelector from "./AppSelector";

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
//
// Project: Integration tests
//      1) DONE: Determine how to mock
//      2) DONE: Mock out calls to search worker initialization
//      3) DONE: Simulate worker responses, if possible. If not, set fake results directly.
//      4) Test for the display of:
//          a) DONE: entries, when results are populated
//          b) about/contact/etc pages, when appropriate MainDisplayAreaMode is set
//          c) inverse when above aren't true

type Timer = ReturnType<typeof setTimeout>;
const TYPING_TIMEOUT_MS = 1000;

export interface ChhaTaigiProps {
    rfc: ReturnedFinalConfig,
    // TODO: always annotate results with the current displaytype's info (one re-search when you change displaytype is well worth being able to calculate before render time (preferably in another thread))
    mockOptions?: OptionsChangeableByUser,
    mockResults?: AnnotatedPerDictResults,
    genUpdateDisplayForDBLoadEvent?: (dbStatus: AllDBLoadStats | {didReload: true}) => Promise<void>,
    genUpdateDisplayForSearchEvent?: (searchContext: SearchContext | null) => Promise<void>,
};

export interface ChhaTaigiState {
    options: OptionsChangeableByUser,
    resultsHolder: SearchResultsHolder,
    isTyping: boolean,
    searchOptionsVisible: boolean,
}

export class ChhaTaigi extends React.Component<ChhaTaigiProps, ChhaTaigiState> {
    private qs = new QueryStringHandler();

    private currentMountAttempt = 0;

    searchBar: React.RefObject<SearchBar>;
    console: StubConsole;
    newestQuery: string;
    appConfig: AppConfig;
    typingTimerIDs: ReturnType<typeof setTimeout>[] = []; // Object to satisfy Node typing
    searchController: SearchController;

    constructor(props: ChhaTaigiProps) {
        super(props);

        const options = this.props.mockOptions ?? this.qs.parse();

        this.appConfig = AppConfig.from(this.props.rfc, options.appID, options.subAppID);

        this.state = {
            options,
            resultsHolder: new SearchResultsHolder(),
            isTyping: false,
            searchOptionsVisible: false,
        };

        this.newestQuery = this.state.options.savedQuery;

        // Miscellaneous object initialization
        this.console = getDebugConsole(this.state.options.debug);
        this.searchBar = React.createRef();

        // Bind functions
        this.startSearchController = this.startSearchController.bind(this);
        this.genRestartSearchController = this.genRestartSearchController.bind(this);
        this.genUpdateQs = this.genUpdateQs.bind(this);

        this.genAddResultsCallback = this.genAddResultsCallback.bind(this);
        this.genClearResultsCallback = this.genClearResultsCallback.bind(this);
        this.getAppSelector = this.getAppSelector.bind(this);
        this.getCurrentMountAttempt = this.getCurrentMountAttempt.bind(this);
        this.getEntryComponents = this.getEntryComponents.bind(this);
        this.getNewestQuery = this.getNewestQuery.bind(this);
        this.getPageView = this.getPageView.bind(this);
        this.hashChange = this.hashChange.bind(this);
        this.handleAppChange = this.handleAppChange.bind(this);
        this.handleSubAppChange = this.handleSubAppChange.bind(this);
        this.loadPage = this.loadPage.bind(this);
        this.goHome = this.goHome.bind(this);
        this.mainDisplayArea = this.mainDisplayArea.bind(this);
        this.overrideResultsForTests = this.overrideResultsForTests.bind(this);
        this.searchQuery = this.searchQuery.bind(this);
        this.subscribeHash = this.subscribeHash.bind(this);
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
        this.console.time("mountToAllDB");

        // TODO: does this need to happen here? can we just start a search?
        this.updateSearchBar(this.getNewestQuery());

        const savedMountAttempt = this.currentMountAttempt;

        // Waiting breaks MountUnmount tests, so don't setTimeout in tests
        const protecc = getProtecc();
        const msToWaitInDevMode = 10;

        // Wait for check that this is actually the final mount attempt
        // (prevents double-loading DBs on localhost, since dev mode often double-mounts)
        protecc(async () => {
            if (this.currentMountAttempt === savedMountAttempt) {
                this.searchController?.startWorkersAndListener(options.searcherType);
                this.subscribeHash();
                if (!runningInJest()) {
                    const {getFontLoader} = await import("./fonts/FontLoader");
                    const fontLoader = getFontLoader(this.appConfig);
                    fontLoader.load();
                }
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
            if (mainMode !== MainDisplayAreaMode.PAGE && this.state.options.pageID !== null) {
                updates.pageID = null;
            }
        }

        this.qs.update(updates, queryStringOpts);

        if (!frontendOpts?.skipStateUpdate) {
            this.setState((state) => ({options: {...state.options, ...updates}}));
        }
    }

    handleAppChange(appID: AppID) {
        this.appConfig = AppConfig.from(this.props.rfc, appID, null);
        const {subAppID} = this.appConfig;
        this.genRestartSearchController();
        this.genUpdateQs({appID, subAppID});
    }

    handleSubAppChange(subAppID: SubAppID) {
        this.appConfig = AppConfig.from(this.props.rfc, this.appConfig.appID, subAppID);
        this.genRestartSearchController();
        this.genUpdateQs({subAppID});
    }

    updateSearchBar(query: string) {
        if (this.searchBar.current) {
            this.searchBar.current.updateAndFocus(query);
        }
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

        const entryContainers = entries.map((entry) =>
            <AgnosticEntryContainer
                debug={options.debug}
                entry={entry}
                blacklistDialectsRegex={this.appConfig.getDialectBlacklistRegex()}
                key={entry.getDisplayKey()} />
        );

        return <>{entryContainers}</>;
    }

    getPageView(): JSX.Element {
        const {pageID} = this.state.options;
        if (pageID !== null) {
            return <CombinedPageElement perAppPages={this.appConfig.pageHandler.getPagesForPageID(pageID)} />
        } else {
            return this.mainDisplayArea(MainDisplayAreaMode.DEFAULT);
        }
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
                return this.getPageView();
            case MainDisplayAreaMode.SEARCH:
                return this.getEntryComponents();
            case MainDisplayAreaMode.DEFAULT:
                return <></>;
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

    render() {
        const {options, searchOptionsVisible} = this.state;

        return <div className="ChhaTaigi">
            <SearchBar
                appConfig={this.appConfig}
                ref={this.searchBar}
                searchQuery={this.searchQuery}
                getNewestQuery={this.getNewestQuery}
                loadPage={this.loadPage}
                goHome={this.goHome}
                toggleSearchOptions={() => this.setState({searchOptionsVisible: !searchOptionsVisible})}
            />
            {searchOptionsVisible ? this.getAppSelector() : null}
            {this.mainDisplayArea(options.mainMode)}
        </div>
    }
}
