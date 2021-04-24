"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var React = __importStar(require("react"));
var react_dom_1 = __importDefault(require("react-dom"));
var fuzzysort_1 = __importDefault(require("fuzzysort"));
var components_1 = require("./components");
var debug_console_1 = __importDefault(require("./debug_console"));
require("./cha_taigi.css");
// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(urgent): have python handle the double-"" in the CSVs
// TODO(high): add other databases from ChhoeTaigi
//               * write out schema
//               * update conversion scripts
//               * decide on display changes for multiple DBs
// TODO(high): handle alternate spellings / parentheticals vs separate fields
// TODO(high): add copyright/about page/info
// TODO(high): Fix clipboard notif not working on most browsers
// TODO(high): Fix typing before load not searching
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): have search updates appear asynchronously from typing
// TODO(high): use react-window or react-virtualized to only need to render X results at a time
// TODO(high): use <mark></mark> instead of individual spans
// TODO(high): create an index of all 3 categories combined, and search that as text?
// TODO(high): remove parentheses from unicode entries, treat as separate results
// TODO(high): let spaces match hyphens and vice-versa
// TODO(high): investigate more performant search solutions (lunr, jssearch, etc)
// TODO(high): benchmark, evaluate search/render perf, especially with multiple databases
// TODO(high): remove parentheses from unicode, treat as separate results, chomp each result
// TODO(mid): keybinding for search (/)
// TODO(mid): "search only as fallback"
// TODO(mid): link to pleco/wiktionary for chinese characters, poj, etc
// TODO(mid): unit/integration tests
// TODO(mid): long press for copy on mobile
// TODO(mid): instead of placeholder, use search box text, and possibly a spinner (for initial loading and search wait)
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): have GET param for search (and options?)
// TODO(low): hashtag load entry (for linking)
// TODO(low): move to camelCase
// TODO(low): prettier search/load indicators
// TODO(low): store options between sessions
// TODO(low): radio buttons of which text to search
// TODO(low): hoabun text click should copy hoabun?
// TODO(low): title
// TODO(low): copyright, links, etc
// TODO(low): fix the default/preview text
// TODO(wishlist): dark mode support
// TODO(wishlist): "add to desktop" shortcut
// TODO(wishlist): non-javascript support?
// TODO(later): generalize for non-english definition
var SEARCH_RESULTS_LIMIT = 20;
var DISPLAY_RESULTS_LIMIT = 20;
var POJ_UNICODE_PREPPED_KEY = "poj_prepped";
var POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
var ENGLISH_PREPPED_KEY = "eng_prepped";
var HOABUN_PREPPED_KEY = "hoa_prepped";
var POJ_UNICODE_SHORTNAME = "p";
var POJ_NORMALIZED_SHORTNAME = "n";
var ENGLISH_SHORTNAME = "e";
var HOABUN_SHORTNAME = "h";
var DEFAULT_INDEXED_KEYS = [
    [POJ_UNICODE_SHORTNAME, POJ_UNICODE_PREPPED_KEY],
    [POJ_NORMALIZED_SHORTNAME, POJ_NORMALIZED_PREPPED_KEY],
    [ENGLISH_SHORTNAME, ENGLISH_PREPPED_KEY],
    [HOABUN_SHORTNAME, HOABUN_PREPPED_KEY],
];
var DEFAULT_SEARCH_KEYS = [POJ_UNICODE_PREPPED_KEY, POJ_NORMALIZED_PREPPED_KEY, ENGLISH_PREPPED_KEY, HOABUN_PREPPED_KEY];
// NOTE(@MrAwesome): mapping of db -> keys -> displaycard element
var DEFAULT_POJ_NORMALIZED_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
var DEFAULT_ENGLISH_INDEX = DEFAULT_SEARCH_KEYS.indexOf(ENGLISH_PREPPED_KEY);
var DEFAULT_POJ_UNICODE_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
var DEFAULT_HOABUN_INDEX = DEFAULT_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);
var fuzzyopts = {
    keys: DEFAULT_SEARCH_KEYS,
    allowTypo: false,
    limit: SEARCH_RESULTS_LIMIT,
    threshold: -10000,
};
function getFuzzyOpts(searchKeys) {
    if (searchKeys === void 0) { searchKeys = DEFAULT_SEARCH_KEYS; }
    return {
        keys: searchKeys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: -10000,
    };
}
var DATABASES = [
    {
        "dbName": "maryknoll",
        "db_filename": "db/maryknoll.json",
        indexed_keys: DEFAULT_INDEXED_KEYS,
        search_keys: DEFAULT_SEARCH_KEYS,
        fuzzy_opts: getFuzzyOpts(),
    },
    {
        "dbName": "embree",
        "db_filename": "db/embree.json",
        indexed_keys: DEFAULT_INDEXED_KEYS,
        search_keys: DEFAULT_SEARCH_KEYS,
        fuzzy_opts: getFuzzyOpts(),
    },
    {
        "dbName": "giku",
        "db_filename": "db/giku.json",
        indexed_keys: DEFAULT_INDEXED_KEYS,
        search_keys: DEFAULT_SEARCH_KEYS,
        fuzzy_opts: getFuzzyOpts(),
    },
];
var OngoingSearch = /** @class */ (function () {
    function OngoingSearch(dbName, query, promise) {
        if (query === void 0) { query = ""; }
        debug_console_1.default.time("asyncSearch-" + dbName);
        this.query = query;
        this.dbName = dbName;
        if (query === "") {
            this.completed = true;
        }
        else {
            this.completed = false;
            this.promise = promise;
        }
    }
    OngoingSearch.prototype.getQuery = function () {
        return this.query;
    };
    OngoingSearch.prototype.isCompleted = function () {
        return this.completed;
    };
    OngoingSearch.prototype.markCompleted = function () {
        this.completed = true;
        debug_console_1.default.timeEnd("asyncSearch-" + this.dbName);
    };
    OngoingSearch.prototype.cancel = function () {
        if (this.promise && !this.isCompleted()) {
            this.promise.cancel();
            this.markCompleted();
        }
    };
    return OngoingSearch;
}());
var IntermediatePerDictResultsElements = /** @class */ (function (_super) {
    __extends(IntermediatePerDictResultsElements, _super);
    function IntermediatePerDictResultsElements() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IntermediatePerDictResultsElements.prototype.render = function () {
        var perDictRes = this.props.perDictRes;
        var dbName = perDictRes.dbName, results = perDictRes.results;
        return jsx_runtime_1.jsxs("div", __assign({ className: "TODO-intermediate-results" }, { children: [jsx_runtime_1.jsx("div", __assign({ className: "TODO-db-header" }, { children: dbName }), void 0), results] }), void 0);
    };
    return IntermediatePerDictResultsElements;
}(React.Component));
var ChaTaigi = /** @class */ (function (_super) {
    __extends(ChaTaigi, _super);
    function ChaTaigi(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            currentResultsElements: [],
            searchableDicts: [],
            ongoingSearches: [],
        };
        _this.onChange = _this.onChange.bind(_this);
        _this.doSearch = _this.doSearch.bind(_this);
        _this.resetSearch = _this.resetSearch.bind(_this);
        _this.createResultsForRender = _this.createResultsForRender.bind(_this);
        _this.fetchDB = _this.fetchDB.bind(_this);
        _this.searchDB = _this.searchDB.bind(_this);
        _this.setStateTyped = _this.setStateTyped.bind(_this);
        _this.getStateTyped = _this.getStateTyped.bind(_this);
        _this.appendSearch = _this.appendSearch.bind(_this);
        _this.appendDict = _this.appendDict.bind(_this);
        _this.appendResults = _this.appendResults.bind(_this);
        return _this;
    }
    ChaTaigi.prototype.setStateTyped = function (state) {
        this.setState(state);
    };
    ChaTaigi.prototype.getStateTyped = function () {
        return this.state;
    };
    ChaTaigi.prototype.componentDidMount = function () {
        DATABASES.forEach(this.fetchDB);
    };
    ChaTaigi.prototype.fetchDB = function (_a) {
        var _this = this;
        var dbName = _a.dbName, db_filename = _a.db_filename;
        debug_console_1.default.time("fetch-" + dbName);
        fetch(db_filename)
            .then(function (response) {
            debug_console_1.default.timeEnd("fetch-" + dbName);
            debug_console_1.default.time("jsonConvert-" + dbName);
            return response.json();
        })
            .then(function (data) {
            debug_console_1.default.timeEnd("jsonConvert-" + dbName);
            debug_console_1.default.time("prepareSlow-" + dbName);
            data.forEach(function (t) {
                // NOTE: prepareSlow does exist.
                // @ts-ignore
                t.poj_prepped = fuzzysort_1.default.prepareSlow(t.p);
                // @ts-ignore
                t.poj_normalized_prepped = fuzzysort_1.default.prepareSlow(t.n);
                // @ts-ignore
                t.eng_prepped = fuzzysort_1.default.prepareSlow(t.e);
                // @ts-ignore
                t.hoa_prepped = fuzzysort_1.default.prepareSlow(t.h);
            });
            debug_console_1.default.timeEnd("prepareSlow-" + dbName);
            debug_console_1.default.time("setLoaded-" + dbName);
            _this.appendDict({
                dbName: dbName,
                searchableEntries: data
            });
            debug_console_1.default.timeEnd("setLoaded-" + dbName);
        });
    };
    ChaTaigi.prototype.appendDict = function (newDict) {
        this.setStateTyped(function (state) { return ({ searchableDicts: __spreadArray(__spreadArray([], state.searchableDicts), [newDict]) }); });
    };
    ChaTaigi.prototype.appendSearch = function (newSearch) {
        this.setStateTyped(function (state) { return ({ ongoingSearches: __spreadArray(__spreadArray([], state.ongoingSearches), [newSearch]) }); });
    };
    ChaTaigi.prototype.appendResults = function (results) {
        debug_console_1.default.time("appendResults-setState");
        var TODO_Intermediate = jsx_runtime_1.jsx(IntermediatePerDictResultsElements, { perDictRes: results }, void 0);
        this.setStateTyped(function (state) { return ({ currentResultsElements: __spreadArray(__spreadArray([], state.currentResultsElements), [TODO_Intermediate]) }); });
        debug_console_1.default.timeEnd("appendResults-setState");
    };
    ChaTaigi.prototype.onChange = function (e) {
        var _a = this.getStateTyped(), searchableDicts = _a.searchableDicts, ongoingSearches = _a.ongoingSearches;
        var _b = e.target, target = _b === void 0 ? {} : _b;
        var _c = target.value, value = _c === void 0 ? "" : _c;
        var query = value;
        ongoingSearches.forEach(function (search) { return search.cancel(); });
        if (query === "") {
            this.resetSearch();
        }
        else {
            // TODO: Correct place for this?
            this.setStateTyped({ query: query, currentResultsElements: [] });
            this.doSearch(query, searchableDicts);
        }
    };
    ChaTaigi.prototype.resetSearch = function () {
        this.setStateTyped({
            query: "",
            //
            // TODO: force cancel all existing searches
            ongoingSearches: [],
            currentResultsElements: []
        });
    };
    ChaTaigi.prototype.doSearch = function (query, searchableDicts) {
        var _this = this;
        searchableDicts.forEach(function (_a) {
            var dbName = _a.dbName, searchableEntries = _a.searchableEntries;
            _this.searchDB(dbName, query, searchableEntries);
        });
    };
    // TODO: Make sure functional, move to file
    ChaTaigi.prototype.searchDB = function (dbName, query, searchableEntries) {
        var _this = this;
        var newSearchPromise = fuzzysort_1.default.goAsync(query, searchableEntries, fuzzyopts);
        var newSearch = new OngoingSearch(dbName, query, newSearchPromise);
        newSearchPromise.then(function (raw_results) {
            newSearch.markCompleted();
            var results = _this.createResultsForRender(
            // @ts-ignore Deal with lack of fuzzysort interfaces
            raw_results);
            _this.appendResults({
                dbName: dbName,
                results: results
            });
        }).catch(debug_console_1.default.log);
        this.appendSearch(newSearch);
    };
    // TODO: move into separate file
    ChaTaigi.prototype.createResultsForRender = function (raw_results) {
        debug_console_1.default.time("createResultsForRender");
        var currentResultsElements = raw_results
            .slice(0, DISPLAY_RESULTS_LIMIT)
            .map(function (fuzzysort_result, i) {
            // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
            //       console.log(fuzzysort_result)
            // TODO: per-db indexing
            var poj_normalized_pre_highlight = fuzzysort_result[DEFAULT_POJ_NORMALIZED_INDEX];
            var english_pre_highlight = fuzzysort_result[DEFAULT_ENGLISH_INDEX];
            var poj_unicode_pre_highlight = fuzzysort_result[DEFAULT_POJ_UNICODE_INDEX];
            var hoabun_pre_highlight = fuzzysort_result[DEFAULT_HOABUN_INDEX];
            var poj_norm_pre_paren = fuzzysort_1.default.highlight(poj_normalized_pre_highlight, "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.n;
            var poj_normalized = "(" + poj_norm_pre_paren + ")";
            var english = fuzzysort_1.default.highlight(english_pre_highlight, "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.e;
            var poj_unicode = fuzzysort_1.default.highlight(poj_unicode_pre_highlight, "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.p;
            var hoabun = fuzzysort_1.default.highlight(hoabun_pre_highlight, "<span class=\"hoabun-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.h;
            var loc_props = {
                key: i,
                poj_unicode_text: fuzzysort_result.obj.p,
                poj_unicode: poj_unicode,
                hoabun: hoabun,
                poj_normalized: poj_normalized,
                english: english,
            };
            return jsx_runtime_1.jsx(components_1.EntryContainer, __assign({}, loc_props), void 0);
        });
        debug_console_1.default.timeEnd("createResultsForRender");
        return currentResultsElements;
    };
    ChaTaigi.prototype.render = function () {
        var onChange = this.onChange;
        var _a = this.getStateTyped(), currentResultsElements = _a.currentResultsElements, searchableDicts = _a.searchableDicts, ongoingSearches = _a.ongoingSearches, query = _a.query;
        var searching = ongoingSearches.some(function (s) { return !s.isCompleted(); });
        return (jsx_runtime_1.jsxs("div", __assign({ className: "ChaTaigi" }, { children: [jsx_runtime_1.jsx(components_1.SearchBar, { onChange: onChange }, void 0),
                jsx_runtime_1.jsx(components_1.PlaceholderArea, { query: query, num_results: currentResultsElements.length, loaded: !!searchableDicts, searching: searching }, void 0),
                jsx_runtime_1.jsx(components_1.ResultsArea, { results: currentResultsElements }, void 0)] }), void 0));
    };
    return ChaTaigi;
}(React.Component));
var rootElement = document.getElementById("root");
react_dom_1.default.render(jsx_runtime_1.jsx(ChaTaigi, {}, void 0), rootElement);
