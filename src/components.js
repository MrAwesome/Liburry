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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBar = exports.ResultsArea = exports.PlaceholderArea = exports.Placeholder = exports.EntryContainer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
class EntryContainer extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            clicked: false,
        };
        this.myOnClick = this.myOnClick.bind(this);
        this.resetClicked = this.resetClicked.bind(this);
        this.clickedNotif = this.clickedNotif.bind(this);
    }
    myOnClick(_) {
        navigator.clipboard.writeText(this.props.poj_unicode_text);
        this.setState({ clicked: true });
        setTimeout(() => this.resetClicked(), 500);
    }
    resetClicked() {
        this.setState({ clicked: false });
    }
    clickedNotif() {
        return jsx_runtime_1.jsx("div", Object.assign({ className: "clicked-notif" }, { children: "Copied POJ to clipboard!" }), void 0);
    }
    render() {
        const { poj_unicode, poj_normalized, english, hoabun } = this.props;
        const { clicked } = this.state;
        // FIXME(https://github.com/farzher/fuzzysort/issues/66)
        const html_poj_unicode = { __html: poj_unicode };
        const html_poj_normalized = { __html: poj_normalized };
        const html_english = { __html: english };
        const html_hoabun = { __html: hoabun };
        const poju = jsx_runtime_1.jsx("span", { className: "poj-unicode", dangerouslySetInnerHTML: html_poj_unicode }, void 0);
        const pojn = jsx_runtime_1.jsx("span", { className: "poj-normalized", dangerouslySetInnerHTML: html_poj_normalized }, void 0);
        const engl = jsx_runtime_1.jsx("span", { className: "english-definition", dangerouslySetInnerHTML: html_english }, void 0);
        const hoab = jsx_runtime_1.jsx("span", { className: "hoabun", dangerouslySetInnerHTML: html_hoabun }, void 0);
        // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
        return (jsx_runtime_1.jsxs("div", Object.assign({ className: clicked ? "entry-container-clicked" : "entry-container", onClick: this.myOnClick }, { children: [jsx_runtime_1.jsx("div", Object.assign({ className: "poj-normalized-container" }, { children: pojn }), void 0),
                jsx_runtime_1.jsx("span", Object.assign({ className: "poj-unicode-container" }, { children: poju }), void 0), "\u00A0", jsx_runtime_1.jsxs("div", Object.assign({ className: "hoabun-container" }, { children: ["(", hoab, ")"] }), void 0),
                jsx_runtime_1.jsx("div", Object.assign({ className: "english-container" }, { children: engl }), void 0), clicked ? this.clickedNotif() : null] }), void 0));
    }
    ;
}
exports.EntryContainer = EntryContainer;
class Placeholder extends React.PureComponent {
    render() {
        const { text } = this.props;
        return jsx_runtime_1.jsx("div", Object.assign({ className: "placeholder" }, { children: text }), void 0);
    }
}
exports.Placeholder = Placeholder;
const loading_paceholder = jsx_runtime_1.jsx(Placeholder, { text: "Loading..." }, void 0);
const loaded_placeholder = jsx_runtime_1.jsx(Placeholder, { text: "Type to search!" }, void 0);
const searching_placeholder = jsx_runtime_1.jsx(Placeholder, { text: "Searching..." }, void 0);
const no_results_placeholder = jsx_runtime_1.jsx(Placeholder, { text: "No results found!" }, void 0);
class PlaceholderArea extends React.PureComponent {
    render() {
        const { query, loaded, searching, num_results } = this.props;
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
        return jsx_runtime_1.jsx("div", Object.assign({ className: "placeholder-container" }, { children: placeholder }), void 0);
    }
}
exports.PlaceholderArea = PlaceholderArea;
class ResultsArea extends React.PureComponent {
    render() {
        const { results } = this.props;
        return jsx_runtime_1.jsx("div", Object.assign({ className: "results-container" }, { children: results }), void 0);
    }
}
exports.ResultsArea = ResultsArea;
class SearchBar extends React.PureComponent {
    render() {
        const { onChange } = this.props;
        return jsx_runtime_1.jsxs("div", Object.assign({ className: "search-bar" }, { children: [jsx_runtime_1.jsx("input", { autoFocus: true, placeholder: "Search...", onChange: onChange }, void 0),
                jsx_runtime_1.jsx("svg", Object.assign({ "aria-hidden": "true", className: "mag-glass" }, { children: jsx_runtime_1.jsx("path", { d: "M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z" }, void 0) }), void 0)] }), void 0);
    }
}
exports.SearchBar = SearchBar;
