"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFuzzySortResultsForRender = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const fuzzysort_1 = __importDefault(require("fuzzysort"));
const debug_console_1 = __importDefault(require("./debug_console"));
const components_1 = require("./components");
// TODO: remove when there are other types of search
const search_options_1 = require("./search_options");
function parseFuzzySortResultsForRender(raw_results) {
    debug_console_1.default.time("parseFuzzySortResultsForRender");
    const currentResultsElements = raw_results
        .slice(0, search_options_1.DISPLAY_RESULTS_LIMIT)
        .map((fuzzysort_result, i) => {
        // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
        //       console.log(fuzzysort_result)
        //
        // TODO: per-db indexing
        const poj_normalized_pre_highlight = fuzzysort_result[search_options_1.DEFAULT_POJ_NORMALIZED_INDEX];
        const english_pre_highlight = fuzzysort_result[search_options_1.DEFAULT_ENGLISH_INDEX];
        const poj_unicode_pre_highlight = fuzzysort_result[search_options_1.DEFAULT_POJ_UNICODE_INDEX];
        const hoabun_pre_highlight = fuzzysort_result[search_options_1.DEFAULT_HOABUN_INDEX];
        const poj_norm_pre_paren = fuzzysort_1.default.highlight(poj_normalized_pre_highlight, "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
            || fuzzysort_result.obj.n;
        const poj_normalized = "(" + poj_norm_pre_paren + ")";
        const english = fuzzysort_1.default.highlight(english_pre_highlight, "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
            || fuzzysort_result.obj.e;
        const poj_unicode = fuzzysort_1.default.highlight(poj_unicode_pre_highlight, "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
            || fuzzysort_result.obj.p;
        const hoabun = fuzzysort_1.default.highlight(hoabun_pre_highlight, "<span class=\"hoabun-matched-text\" class=hlsearch>", "</span>")
            || fuzzysort_result.obj.h;
        const loc_props = {
            key: i,
            poj_unicode_text: fuzzysort_result.obj.p,
            poj_unicode,
            hoabun,
            poj_normalized,
            english,
        };
        return jsx_runtime_1.jsx(components_1.EntryContainer, Object.assign({}, loc_props), void 0);
    });
    debug_console_1.default.timeEnd("parseFuzzySortResultsForRender");
    return currentResultsElements;
}
exports.parseFuzzySortResultsForRender = parseFuzzySortResultsForRender;
