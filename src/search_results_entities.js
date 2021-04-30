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
function parseFuzzySortResultsForRender(dbName, rawResults) {
    debug_console_1.default.time("parseFuzzySortResultsForRender");
    const currentResultsElements = rawResults
        .slice(0, search_options_1.DISPLAY_RESULTS_LIMIT)
        .map((fuzzysortResult, _) => {
        const obj = fuzzysortResult.obj;
        const pojUnicodeText = obj.p;
        const rowID = obj.d;
        // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
        //       console.log(fuzzysortResult)
        //
        // TODO: per-db indexing
        const pojNormalizedPreHighlight = fuzzysortResult[search_options_1.DEFAULT_POJ_NORMALIZED_INDEX];
        const englishPreHighlight = fuzzysortResult[search_options_1.DEFAULT_ENGLISH_INDEX];
        const pojUnicodePreHighlight = fuzzysortResult[search_options_1.DEFAULT_POJ_UNICODE_INDEX];
        const hoabunPreHighlight = fuzzysortResult[search_options_1.DEFAULT_HOABUN_INDEX];
        const pojNormPreParen = fuzzysort_1.default.highlight(pojNormalizedPreHighlight, "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
            || obj.n;
        const pojNormalized = "(" + pojNormPreParen + ")";
        const english = fuzzysort_1.default.highlight(englishPreHighlight, "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
            || obj.e;
        const pojUnicode = fuzzysort_1.default.highlight(pojUnicodePreHighlight, "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
            || pojUnicodeText;
        const hoabun = fuzzysort_1.default.highlight(hoabunPreHighlight, "<span class=\"hoabun-matched-text\" class=hlsearch>", "</span>")
            || obj.h;
        const locProps = {
            key: dbName + "-" + rowID,
            pojUnicodeText,
            pojUnicode,
            hoabun,
            pojNormalized,
            english,
        };
        return jsx_runtime_1.jsx(components_1.EntryContainer, Object.assign({}, locProps), void 0);
    });
    debug_console_1.default.timeEnd("parseFuzzySortResultsForRender");
    return currentResultsElements;
}
exports.parseFuzzySortResultsForRender = parseFuzzySortResultsForRender;
