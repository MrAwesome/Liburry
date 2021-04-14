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
var react_1 = __importStar(require("react"));
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
        return react_1.default.createElement("div", { className: "clicked-notif" }, "Copied POJ to clipboard!");
    };
    EntryContainer.prototype.render = function () {
        var _a = this.props, poj_unicode = _a.poj_unicode, poj_normalized = _a.poj_normalized, english = _a.english, hoabun = _a.hoabun;
        var clicked = this.state.clicked;
        // FIXME(https://github.com/farzher/fuzzysort/issues/66)
        var html_poj_unicode = { __html: poj_unicode };
        var html_poj_normalized = { __html: poj_normalized };
        var html_english = { __html: english };
        var html_hoabun = { __html: hoabun };
        var poju = react_1.default.createElement("span", { className: "poj-unicode", dangerouslySetInnerHTML: html_poj_unicode });
        var pojn = react_1.default.createElement("span", { className: "poj-normalized", dangerouslySetInnerHTML: html_poj_normalized });
        var engl = react_1.default.createElement("span", { className: "english-definition", dangerouslySetInnerHTML: html_english });
        var hoab = react_1.default.createElement("span", { className: "hoabun", dangerouslySetInnerHTML: html_hoabun });
        // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
        return (react_1.default.createElement("div", { className: clicked ? "entry-container-clicked" : "entry-container", onClick: this.myOnClick },
            react_1.default.createElement("div", { className: "poj-normalized-container" }, pojn),
            react_1.default.createElement("span", { className: "poj-unicode-container" }, poju),
            "\u00A0",
            react_1.default.createElement("div", { className: "hoabun-container" },
                "(",
                hoab,
                ")"),
            react_1.default.createElement("div", { className: "english-container" }, engl),
            clicked ? this.clickedNotif() : null));
    };
    ;
    return EntryContainer;
}(react_1.PureComponent));
exports.EntryContainer = EntryContainer;
var Placeholder = /** @class */ (function (_super) {
    __extends(Placeholder, _super);
    function Placeholder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Placeholder.prototype.render = function () {
        var text = this.props.text;
        return react_1.default.createElement("div", { className: "placeholder" }, text);
    };
    return Placeholder;
}(react_1.PureComponent));
exports.Placeholder = Placeholder;
var loading_paceholder = react_1.default.createElement(Placeholder, { text: "Loading..." });
var loaded_placeholder = react_1.default.createElement(Placeholder, { text: "Type to search!" });
var searching_placeholder = react_1.default.createElement(Placeholder, { text: "Searching..." });
var no_results_placeholder = react_1.default.createElement(Placeholder, { text: "No results found!" });
var PlaceholderArea = /** @class */ (function (_super) {
    __extends(PlaceholderArea, _super);
    function PlaceholderArea() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlaceholderArea.prototype.render = function () {
        var _a = this.props, query = _a.query, loaded = _a.loaded, searching = _a.searching, num_results = _a.num_results;
        var placeholder = null;
        if (query) {
            if (searching) {
                placeholder = searching_placeholder;
            }
            else {
                if (!num_results) {
                    placeholder = no_results_placeholder;
                }
                else {
                    placeholder = null;
                }
            }
        }
        else {
            if (loaded) {
                placeholder = loaded_placeholder;
            }
            else {
                placeholder = loading_paceholder;
            }
        }
        return react_1.default.createElement("div", { className: "placeholder-container" }, query ? null : placeholder);
    };
    return PlaceholderArea;
}(react_1.PureComponent));
exports.PlaceholderArea = PlaceholderArea;
var ResultsArea = /** @class */ (function (_super) {
    __extends(ResultsArea, _super);
    function ResultsArea() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // TODO: Doesn't seem to work as intended
    //  shouldComponentUpdate() {
    //    const {searching} = this.props;
    //    return !searching;
    //  }
    ResultsArea.prototype.render = function () {
        var _a = this.props, query = _a.query, results = _a.results;
        return react_1.default.createElement("div", { className: "results-container" }, query ? results : null);
    };
    return ResultsArea;
}(react_1.Component));
exports.ResultsArea = ResultsArea;
var SearchBar = /** @class */ (function (_super) {
    __extends(SearchBar, _super);
    function SearchBar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SearchBar.prototype.render = function () {
        var onChange = this.props.onChange;
        return react_1.default.createElement("div", { className: "search-bar" },
            react_1.default.createElement("input", { autoFocus: true, placeholder: "Search...", onChange: onChange }),
            react_1.default.createElement("svg", { "aria-hidden": "true", className: "mag-glass" },
                react_1.default.createElement("path", { d: "M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z" })));
    };
    return SearchBar;
}(react_1.PureComponent));
exports.SearchBar = SearchBar;
