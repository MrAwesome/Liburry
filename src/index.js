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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var React = __importStar(require("react"));
var react_dom_1 = __importDefault(require("react-dom"));
var fuzzysort_1 = __importDefault(require("fuzzysort"));
var components_1 = require("./components");
require("./cha_taigi.css");
// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(high): add other databases from ChhoeTaigi
//               * write out schema
//               * update conversion scripts
//               * decide on display changes for multiple DBs
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
// TODO(mid): unit/integration tests
// TODO(mid): long press for copy on mobile
// TODO(mid): instead of placeholder, use search box text, and possibly a spinner (for initial loading and search wait)
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): have GET param for search (and options?)
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
var rem_url = "db/maryknoll.json";
// NOTE(@MrAwesome): mapping of db -> keys -> displaycard element
var POJ_UNICODE_PREPPED_KEY = "poj_prepped";
var POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
var ENGLISH_PREPPED_KEY = "eng_prepped";
var HOABUN_PREPPED_KEY = "hoa_prepped";
var MARYKNOLL_SEARCH_KEYS = [POJ_UNICODE_PREPPED_KEY, POJ_NORMALIZED_PREPPED_KEY, ENGLISH_PREPPED_KEY, HOABUN_PREPPED_KEY];
var POJ_NORMALIZED_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
var ENGLISH_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(ENGLISH_PREPPED_KEY);
var POJ_UNICODE_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
var HOABUN_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);
var OngoingSearch = /** @class */ (function () {
    function OngoingSearch(query, promise) {
        if (query === void 0) { query = ""; }
        this.query = query;
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
        debugConsole.timeEnd("asyncSearch");
    };
    OngoingSearch.prototype.cancel = function () {
        if (this.promise && !this.isCompleted()) {
            this.promise.cancel();
            this.markCompleted();
        }
    };
    return OngoingSearch;
}());
var fuzzyopts = {
    keys: MARYKNOLL_SEARCH_KEYS,
    allowTypo: false,
    limit: SEARCH_RESULTS_LIMIT,
    threshold: -10000,
};
var FakeConsole = /** @class */ (function () {
    function FakeConsole() {
    }
    FakeConsole.prototype.time = function (_) { };
    FakeConsole.prototype.timeEnd = function (_) { };
    FakeConsole.prototype.log = function () {
        var _ = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _[_i] = arguments[_i];
        }
    };
    return FakeConsole;
}());
// TODO: make this use a GET flag
var DEBUG_MODE = false;
var debugConsole = DEBUG_MODE ? console : new FakeConsole();
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            results: [],
            dictionaryDB: [],
            ongoingSearch: new OngoingSearch(),
        };
        _this.onChange = _this.onChange.bind(_this);
        _this.doSearch = _this.doSearch.bind(_this);
        _this.resetSearch = _this.resetSearch.bind(_this);
        _this.createResultsForRender = _this.createResultsForRender.bind(_this);
        return _this;
    }
    App.prototype.componentDidMount = function () {
        var _this = this;
        debugConsole.time("fetch");
        fetch(rem_url)
            .then(function (response) {
            debugConsole.timeEnd("fetch");
            debugConsole.time("jsonConvert");
            return response.json();
        })
            .then(function (data) {
            debugConsole.timeEnd("jsonConvert");
            debugConsole.time("prepareSlow");
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
            debugConsole.timeEnd("prepareSlow");
            debugConsole.time("setLoaded");
            _this.setState({ dictionaryDB: data });
            debugConsole.timeEnd("setLoaded");
        });
    };
    App.prototype.onChange = function (e) {
        var _a = this.state, dictionaryDB = _a.dictionaryDB, ongoingSearch = _a.ongoingSearch;
        var _b = e.target, target = _b === void 0 ? {} : _b;
        var _c = target.value, value = _c === void 0 ? "" : _c;
        var query = value;
        ongoingSearch.cancel();
        if (query === "") {
            this.resetSearch();
        }
        else {
            this.doSearch(query, dictionaryDB);
        }
    };
    App.prototype.resetSearch = function () {
        this.setState({
            query: "",
            ongoingSearch: new OngoingSearch(),
            results: []
        });
    };
    App.prototype.doSearch = function (query, dictionaryDB) {
        var _this = this;
        debugConsole.time("asyncSearch");
        var newSearchPromise = fuzzysort_1.default.goAsync(query, dictionaryDB, fuzzyopts);
        var newSearch = new OngoingSearch(query, newSearchPromise);
        newSearchPromise.then(function (raw_results) {
            newSearch.markCompleted();
            return _this.createResultsForRender(
            // @ts-ignore Deal with lack of fuzzysort interfaces
            raw_results);
        }).catch(debugConsole.log);
        this.setState({
            ongoingSearch: newSearch
        });
    };
    App.prototype.createResultsForRender = function (raw_results) {
        debugConsole.time("createResultsForRender");
        var results = raw_results
            .slice(0, DISPLAY_RESULTS_LIMIT)
            .map(function (fuzzysort_result, i) {
            var poj_normalized_pre_highlight = fuzzysort_result[POJ_NORMALIZED_INDEX];
            var english_pre_highlight = fuzzysort_result[ENGLISH_INDEX];
            var poj_unicode_pre_highlight = fuzzysort_result[POJ_UNICODE_INDEX];
            var hoabun_pre_highlight = fuzzysort_result[HOABUN_INDEX];
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
        debugConsole.timeEnd("createResultsForRender");
        debugConsole.time("createResultsForRender-setState");
        this.setState({ results: results });
        debugConsole.timeEnd("createResultsForRender-setState");
    };
    App.prototype.render = function () {
        var onChange = this.onChange;
        var _a = this.state, results = _a.results, dictionaryDB = _a.dictionaryDB, ongoingSearch = _a.ongoingSearch;
        var searching = !ongoingSearch.isCompleted();
        var query = ongoingSearch.getQuery();
        return (jsx_runtime_1.jsxs("div", __assign({ className: "App" }, { children: [jsx_runtime_1.jsx(components_1.SearchBar, { onChange: onChange }, void 0),
                jsx_runtime_1.jsx(components_1.PlaceholderArea, { query: query, num_results: results.length, loaded: !!dictionaryDB, searching: searching }, void 0),
                jsx_runtime_1.jsx(components_1.ResultsArea, { results: results }, void 0)] }), void 0));
    };
    return App;
}(React.Component));
var rootElement = document.getElementById("root");
react_dom_1.default.render(jsx_runtime_1.jsx(App, {}, void 0), rootElement);
