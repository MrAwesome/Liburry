"use strict";
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
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_dom_1 = __importDefault(require("react-dom"));
const components_1 = require("./components");
const debug_console_1 = __importDefault(require("./debug_console"));
const dictionary_handling_1 = require("./dictionary_handling");
require("./cha_taigi.css");
require("./menu.css");
const search_1 = require("./search");
const search_options_1 = require("./search_options");
const cha_menu_1 = require("./cha_menu");
const reportWebVitals_1 = __importDefault(require("./reportWebVitals"));
// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(high): determine why duplicate search results are sometimes returned (see "a" results for giku)
// TODO(high): add keys as opposed to indices
// TODO(high): add other databases from ChhoeTaigi
//               * write out schema
//               * update conversion scripts
//               * decide on display changes for multiple DBs
// TODO(high): handle alternate spellings / parentheticals vs separate fields
// TODO(high): handle explanation text (see "le" in Giku)
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
// TODO(mid): Handle parentheses in pojUnicode in maryknoll: "kàu chia (án-ni) jî-í" (giku), "nā-tiāⁿ (niā-tiāⁿ, niā-niā)" (maryknoll)
// TODO(mid): "search only as fallback"
// TODO(mid): link to pleco/wiktionary for chinese characters, poj, etc
// TODO(mid): unit/integration tests
// TODO(mid): long press for copy on mobile
// TODO(mid): replace loading placeholder with *grid* of db loading updates
// TODO(mid): move search bar to middle of page when no results and no search yet
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
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
// TODO(low): fix the default/preview text
// TODO(wishlist): dark mode support
// TODO(wishlist): "add to desktop" shortcut
// TODO(wishlist): non-javascript support?
// TODO(later): generalize for non-english definition
class IntermediatePerDictResultsElements extends React.Component {
    render() {
        const { perDictRes } = this.props;
        const { dbName, results } = perDictRes;
        return jsx_runtime_1.jsxs("div", Object.assign({ className: "TODO-intermediate-results" }, { children: [jsx_runtime_1.jsx("div", Object.assign({ className: "TODO-db-header" }, { children: dbName }), void 0), results] }), void 0);
    }
}
class ChaTaigi extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentResultsElements: [],
            searchableDicts: [],
            ongoingSearches: [],
        };
        this.onChange = this.onChange.bind(this);
        this.doSearch = this.doSearch.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.setStateTyped = this.setStateTyped.bind(this);
        this.getStateTyped = this.getStateTyped.bind(this);
        this.appendSearch = this.appendSearch.bind(this);
        this.appendDict = this.appendDict.bind(this);
        this.appendResults = this.appendResults.bind(this);
        this.menu = this.menu.bind(this);
    }
    setStateTyped(state) {
        this.setState(state);
    }
    getStateTyped() {
        return this.state;
    }
    componentDidMount() {
        for (let [dbName, langDB] of search_options_1.DATABASES) {
            dictionary_handling_1.fetchDB(dbName, langDB, this.appendDict);
        }
    }
    appendDict(newDict) {
        this.setStateTyped((state) => ({ searchableDicts: [...state.searchableDicts, newDict] }));
    }
    appendSearch(newSearch) {
        this.setStateTyped((state) => ({ ongoingSearches: [...state.ongoingSearches, newSearch] }));
    }
    appendResults(results) {
        debug_console_1.default.time("appendResults-setState");
        const TODOIntermediate = jsx_runtime_1.jsx(IntermediatePerDictResultsElements, { perDictRes: results }, results.dbName);
        this.setStateTyped((state) => ({ currentResultsElements: [...state.currentResultsElements, TODOIntermediate] }));
        debug_console_1.default.timeEnd("appendResults-setState");
    }
    onChange(e) {
        const { searchableDicts, ongoingSearches } = this.getStateTyped();
        const { target = {} } = e;
        const { value = "" } = target;
        const query = value;
        ongoingSearches.forEach((search) => search.cancel());
        if (query === "") {
            this.resetSearch();
        }
        else {
            // TODO: Correct place for this?
            this.setStateTyped({ query, currentResultsElements: [] });
            this.doSearch(query, searchableDicts);
        }
    }
    menu() {
        return jsx_runtime_1.jsx(cha_menu_1.ChaMenu, {}, void 0);
    }
    resetSearch() {
        this.setStateTyped({
            query: "",
            ongoingSearches: [],
            currentResultsElements: []
        });
    }
    doSearch(query, searchableDicts) {
        searchableDicts.forEach((searchableDict) => {
            search_1.searchDB(searchableDict, query, this.appendSearch, this.appendResults);
        });
    }
    render() {
        const { onChange } = this;
        const { currentResultsElements, searchableDicts, ongoingSearches, query } = this.getStateTyped();
        const searching = ongoingSearches.some((s) => !s.isCompleted());
        return (jsx_runtime_1.jsxs("div", Object.assign({ className: "ChaTaigi" }, { children: [this.menu(), jsx_runtime_1.jsxs("div", Object.assign({ className: "non-menu" }, { children: [jsx_runtime_1.jsx(components_1.SearchBar, { onChange: onChange }, void 0),
                        jsx_runtime_1.jsx(components_1.PlaceholderArea, { query: query, numResults: currentResultsElements.length, loaded: !!searchableDicts, searching: searching }, void 0),
                        jsx_runtime_1.jsx(components_1.ResultsArea, { results: currentResultsElements }, void 0)] }), void 0)] }), void 0));
    }
}
const rootElement = document.getElementById("root");
react_dom_1.default.render(jsx_runtime_1.jsx(ChaTaigi, {}, void 0), rootElement);
reportWebVitals_1.default(console.log);
