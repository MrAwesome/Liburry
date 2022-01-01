import qs from "qs";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import {AppID, PageID, SubAppID} from "./configHandler/zodConfigTypes";
import {SearcherType} from "./search/searchers/Searcher";
import {MainDisplayAreaMode} from "./types/displayTypes";

// TODO: fix double-back being necessary
// TODO: allow for bundled updates
// TODO: cache values for faster checking (check browser state?)

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

// These are the actual fields used/set in the hash
const QUERY = "q";
const MODE = "m";
const PAGE = "p";
const DEBUG = "debug";
const SEARCHER = "searcher";
const PLAYGROUND = "playground";
const APP = "app";
const SUBAPP = "subapp";

const QS_SORT_FN = (a: string, b: string) => {
    if (a === b) {
        return 0;
    } else if (a === QUERY) {
        return 1;
    } else if (b === QUERY) {
        return -1;
    } else {
        return a.localeCompare(b);
    }
};

const QS_PARSE_OPTS = {delimiter: ';'};
const QS_STRINGIFY_OPTS = {delimiter: ';', sort: QS_SORT_FN};

// TODO: make this take a partial object of desired updates to values, and have a single set and get
export default class QueryStringParser {
    private testString?: string;
    constructor(testString?: string) {
        this.testString = testString;
    }

    getString(): string {
        return this.testString ?? window.location.hash.replace(/^#/, "");
    }

    updateQueryWithoutHistoryChange(query: string) {
        this.update(QUERY, query, {doNotModifyHistory: true});
    }

    saveQuery(query: string) {
        this.update(QUERY, query);
    }

    setMode(mode: MainDisplayAreaMode) {
        this.update(MODE, mode, {doNotModifyHistory: true});
    }

    setApp(appID: AppID) {
        this.update(APP, appID);
    }

    setSubApp(subAppID: SubAppID) {
        this.update(SUBAPP, subAppID);
    }

    clearSubApp() {
        this.update(SUBAPP, null);
    }

    setPage(page: PageID) {
        this.update(PAGE, page);
    }

    clearPage() {
        this.update(PAGE, null);
    }

    // Used to create a history entry on load, so that the back button will load
    // the original state after typing.
    anchor() {
        if (window.history.length < 3) {
            const parsed = this.parseInternal();
            const newHashString = this.stringifyInternal(parsed);
            window.history.pushState(parsed, '', "#" + newHashString);
        }
    }

    private parseInternal() {
        return qs.parse(this.getString(), QS_PARSE_OPTS);
    }

    private stringifyInternal(parsed: qs.ParsedQs) {
        return qs.stringify(parsed, QS_STRINGIFY_OPTS);
    }

    private update(
        field: string,
        value: string | null,
        opts?: {
            doNotModifyHistory?: boolean
        }
    ) {
        const parsed = this.parseInternal();

        // null for value is shorthand for "delete the field entirely".
        if (value === null) {
            delete parsed[field];
        } else {
            parsed[field] = value;
        }
        const newHashString = this.stringifyInternal(parsed);

        if (this.testString) {
            this.testString = newHashString;
        } else {
            const args: [Object, string, string] = [parsed, '', "#" + newHashString];
            const shouldSave = !(opts?.doNotModifyHistory);
            if (shouldSave) {
                window.history.pushState(...args);
            } else {
                window.history.replaceState(...args);
            }
        }
    }

    parse(): OptionsChangeableByUser {
        let options = new OptionsChangeableByUser();
        const parsed = this.parseInternal();
        const q = parsed[QUERY];
        const searcher = parsed[SEARCHER];
        const appID = parsed[APP];
        const subAppID = parsed[SUBAPP];

        if (typeof q === "string") {
            options.savedQuery = q;
        }
        const mode = parsed[MODE];
        if (typeof mode === "string") {
            if (mode in MainDisplayAreaMode) {
                options.mainMode = mode as MainDisplayAreaMode;
            }
        }

        const pageID = parsed[PAGE];
        if (typeof pageID === "string") {
            options.pageID = pageID as PageID;
        }

        // TODO: abstract away this process
        options.debug = parsed[DEBUG] !== undefined;
        options.playground = parsed[PLAYGROUND] !== undefined;

        if (typeof searcher === "string") {
            const searcherUpper = searcher.toUpperCase();
            if (searcherUpper in SearcherType) {
                options.searcherType = SearcherType[searcherUpper as keyof typeof SearcherType];
            }
        }

        if (typeof appID === "string") {
            options.appID = appID;
        }

        if (typeof subAppID === "string") {
            options.subAppID = subAppID;
        }

        return options;
    }
}
