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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBar = exports.ResultsArea = exports.PlaceholderArea = exports.Placeholder = exports.EntryContainer = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = __importStar(require("react"));
var EntryContainer = /** @class */ (function (_super) {
    __extends(EntryContainer, _super);
    function EntryContainer(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            clicked: false,
        };
        _this.myOnClick = _this.myOnClick.bind(_this);
        _this.resetClicked = _this.resetClicked.bind(_this);
        _this.clickedNotif = _this.clickedNotif.bind(_this);
        return _this;
    }
    EntryContainer.prototype.myOnClick = function (_) {
        var _this = this;
        navigator.clipboard.writeText(this.props.poj_unicode_text);
        this.setState({ clicked: true });
        setTimeout(function () { return _this.resetClicked(); }, 500);
    };
    EntryContainer.prototype.resetClicked = function () {
        this.setState({ clicked: false });
    };
    EntryContainer.prototype.clickedNotif = function () {
        return jsx_runtime_1.jsx("div", __assign({ className: "clicked-notif" }, { children: "Copied POJ to clipboard!" }), void 0);
    };
    EntryContainer.prototype.render = function () {
        var _a = this.props, poj_unicode = _a.poj_unicode, poj_normalized = _a.poj_normalized, english = _a.english, hoabun = _a.hoabun;
        var clicked = this.state.clicked;
        // FIXME(https://github.com/farzher/fuzzysort/issues/66)
        var html_poj_unicode = { __html: poj_unicode };
        var html_poj_normalized = { __html: poj_normalized };
        var html_english = { __html: english };
        var html_hoabun = { __html: hoabun };
        var poju = jsx_runtime_1.jsx("span", { className: "poj-unicode", dangerouslySetInnerHTML: html_poj_unicode }, void 0);
        var pojn = jsx_runtime_1.jsx("span", { className: "poj-normalized", dangerouslySetInnerHTML: html_poj_normalized }, void 0);
        var engl = jsx_runtime_1.jsx("span", { className: "english-definition", dangerouslySetInnerHTML: html_english }, void 0);
        var hoab = jsx_runtime_1.jsx("span", { className: "hoabun", dangerouslySetInnerHTML: html_hoabun }, void 0);
        // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
        return (jsx_runtime_1.jsxs("div", __assign({ className: clicked ? "entry-container-clicked" : "entry-container", onClick: this.myOnClick }, { children: [jsx_runtime_1.jsx("div", __assign({ className: "poj-normalized-container" }, { children: pojn }), void 0),
                jsx_runtime_1.jsx("span", __assign({ className: "poj-unicode-container" }, { children: poju }), void 0), "\u00A0", jsx_runtime_1.jsxs("div", __assign({ className: "hoabun-container" }, { children: ["(", hoab, ")"] }), void 0),
                jsx_runtime_1.jsx("div", __assign({ className: "english-container" }, { children: engl }), void 0), clicked ? this.clickedNotif() : null] }), void 0));
    };
    ;
    return EntryContainer;
}(React.PureComponent));
exports.EntryContainer = EntryContainer;
var Placeholder = /** @class */ (function (_super) {
    __extends(Placeholder, _super);
    function Placeholder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Placeholder.prototype.render = function () {
        var text = this.props.text;
        return jsx_runtime_1.jsx("div", __assign({ className: "placeholder" }, { children: text }), void 0);
    };
    return Placeholder;
}(React.PureComponent));
exports.Placeholder = Placeholder;
var loading_paceholder = jsx_runtime_1.jsx(Placeholder, { text: "Loading..." }, void 0);
var loaded_placeholder = jsx_runtime_1.jsx(Placeholder, { text: "Type to search!" }, void 0);
var searching_placeholder = jsx_runtime_1.jsx(Placeholder, { text: "Searching..." }, void 0);
var no_results_placeholder = jsx_runtime_1.jsx(Placeholder, { text: "No results found!" }, void 0);
var PlaceholderArea = /** @class */ (function (_super) {
    __extends(PlaceholderArea, _super);
    function PlaceholderArea() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlaceholderArea.prototype.render = function () {
        var _a = this.props, query = _a.query, loaded = _a.loaded, searching = _a.searching, num_results = _a.num_results;
        var placeholder = null;
        if (!num_results) {
            if (searching) {
                placeholder = searching_placeholder;
            }
            else {
                if (query) {
                    placeholder = no_results_placeholder;
                }
                else {
                    placeholder = loaded ? loaded_placeholder : loading_paceholder;
                }
            }
        }
        return jsx_runtime_1.jsx("div", __assign({ className: "placeholder-container" }, { children: placeholder }), void 0);
    };
    return PlaceholderArea;
}(React.PureComponent));
exports.PlaceholderArea = PlaceholderArea;
var ResultsArea = /** @class */ (function (_super) {
    __extends(ResultsArea, _super);
    function ResultsArea() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ResultsArea.prototype.render = function () {
        var results = this.props.results;
        return jsx_runtime_1.jsx("div", __assign({ className: "results-container" }, { children: results }), void 0);
    };
    return ResultsArea;
}(React.PureComponent));
exports.ResultsArea = ResultsArea;
var SearchBar = /** @class */ (function (_super) {
    __extends(SearchBar, _super);
    function SearchBar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SearchBar.prototype.render = function () {
        var onChange = this.props.onChange;
        return jsx_runtime_1.jsxs("div", __assign({ className: "search-bar" }, { children: [jsx_runtime_1.jsx("input", { autoFocus: true, placeholder: "Search...", onChange: onChange }, void 0),
                jsx_runtime_1.jsx("svg", __assign({ "aria-hidden": "true", className: "mag-glass" }, { children: jsx_runtime_1.jsx("path", { d: "M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z" }, void 0) }), void 0)] }), void 0);
    };
    return SearchBar;
}(React.PureComponent));
exports.SearchBar = SearchBar;
