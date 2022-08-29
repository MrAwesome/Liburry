import qs from "qs";
import {KnownDialectID} from "../generated/i18n";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import {PageID} from "./configHandler/zodConfigTypes";
import {SearchResultsDisplayMode} from "./resultsDisplay/ResultsDisplay";
import {SearcherType} from "./search/searchers/Searcher";
import {MainDisplayAreaMode} from "./types/displayTypes";
import {getRecordEntries, noop} from "./utils";
import {TypeEquals} from "./utils/typeEquality";

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
const DIALECT = "d";
const DEBUG = "debug";
const SEARCHER = "searcher";
const PLAYGROUND = "playground";
const APP = "app";
const SUBAPP = "subapp";
const SEARCH_RESULTS_DISPLAY_MODE = "dm";

const FIELDTYPE_TO_FIELDKEY_MAPPING = {
    savedQuery: QUERY,
    mainMode: MODE,
    searchResultsDisplayMode: SEARCH_RESULTS_DISPLAY_MODE,
    pageID: PAGE,
    debug: DEBUG,
    searcherType: SEARCHER,
    playground: PLAYGROUND,
    appID: APP,
    subAppID: SUBAPP,
    dialectID: DIALECT,
} as const;

export type QueryStringFieldType = keyof typeof FIELDTYPE_TO_FIELDKEY_MAPPING;

// If you see a type error here, it means that the keys of 
// OptionsChangeableByUser and FIELDTYPE_TO_FIELDKEY_MAPPING no longer match.
const _optsSame: TypeEquals<keyof OptionsChangeableByUser, QueryStringFieldType> = true;
noop(_optsSame);

//type QueryStringActualKey = typeof FIELDTYPE_TO_FIELDKEY_MAPPING[QueryStringFieldType];


export type QSUpdateOpts = {
    modifyHistInPlace?: boolean
}

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

    private getString(): string {
        return this.testString ?? window.location.hash.replace(/^#/, "");
    }

    private parseInternal() {
        return qs.parse(this.getString(), QS_PARSE_OPTS);
    }

    private stringifyInternal(parsed: qs.ParsedQs) {
        return qs.stringify(parsed, QS_STRINGIFY_OPTS);
    }

    // Used to create a history entry on load, so that the back button will load
    // the original state after typing.
    anchor() {
        if (window.history.length < 3) {
            this.update({});
        }
    }

    update(
        updates: Partial<OptionsChangeableByUser>,
        opts?: QSUpdateOpts,
    ) {
        //const oldHashString = this.getString();
        const parsed = this.parseInternal();

        getRecordEntries(updates).forEach(([fieldType, value]) => {
            const fieldKey = FIELDTYPE_TO_FIELDKEY_MAPPING[fieldType as QueryStringFieldType];

            // null for value is shorthand for "delete the field entirely".
            if (value === null) {
                delete parsed[fieldKey];
            } else {
                if (typeof value === "boolean") {
                    parsed[fieldKey] = value ? "true" : "false";
                } else {
                    parsed[fieldKey] = value;
                }
            }
        });

        const newHashString = this.stringifyInternal(parsed);

        if (this.testString) {
            this.testString = newHashString;
        } else {
            const withHash = `${newHashString ? "#" : ""}${newHashString}`;
            const args: [Object, string, string] = [parsed, '', withHash];
            const shouldSave = !(opts?.modifyHistInPlace);
            if (shouldSave) {
                window.history.pushState(...args);
            } else {
                window.history.replaceState(...args);
            }
        }
    }

    // TODO: Handle typing for e.g. dialect
    parse(): OptionsChangeableByUser {
        const options = new OptionsChangeableByUser();
        const parsed = this.parseInternal();
        const query = parsed[QUERY];
        const searcher = parsed[SEARCHER];
        const appID = parsed[APP];
        const subAppID = parsed[SUBAPP];
        const dialect = parsed[DIALECT];
        const srdm = parsed[SEARCH_RESULTS_DISPLAY_MODE];

        if (typeof query === "string") {
            options.savedQuery = query;
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
        options.debug = parsed[DEBUG] !== "false" && parsed[DEBUG] !== undefined;
        options.playground = parsed[PLAYGROUND] !== "false" && parsed[PLAYGROUND] !== undefined;

        if (typeof searcher === "string") {
            const searcherUpper = searcher.toUpperCase();
            if (searcherUpper in SearcherType) {
                options.searcherType = SearcherType[searcherUpper as keyof typeof SearcherType];
            }
        }

        if (typeof srdm === "string") {
            const srdmUpper = srdm.toUpperCase();
            if (srdmUpper in SearchResultsDisplayMode) {
                options.searchResultsDisplayMode = SearchResultsDisplayMode[srdmUpper as keyof typeof SearchResultsDisplayMode];
            }
        }

        if (typeof appID === "string") {
            options.appID = appID;
        }

        if (typeof dialect === "string") {
            options.dialectID = dialect as KnownDialectID;
        }

        if (typeof subAppID === "string") {
            options.subAppID = subAppID;
        }

        return options;
    }
}
