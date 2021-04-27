import fuzzysort from "fuzzysort";
import debugConsole from "./debug_console";
import {EntryContainer} from "./components";
import {KeyResults} from "./types";

// TODO: remove when there are other types of search
import {DEFAULT_ENGLISH_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./search_options";

export function parseFuzzySortResultsForRender(raw_results: KeyResults[]): JSX.Element[] {
    debugConsole.time("parseFuzzySortResultsForRender");
    const currentResultsElements = raw_results
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((fuzzysort_result: KeyResults, i: number) => {
            // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
            //       console.log(fuzzysort_result)
            //
            // TODO: per-db indexing
            const poj_normalized_pre_highlight = fuzzysort_result[DEFAULT_POJ_NORMALIZED_INDEX];
            const english_pre_highlight = fuzzysort_result[DEFAULT_ENGLISH_INDEX];
            const poj_unicode_pre_highlight = fuzzysort_result[DEFAULT_POJ_UNICODE_INDEX];
            const hoabun_pre_highlight = fuzzysort_result[DEFAULT_HOABUN_INDEX];

            const poj_norm_pre_paren = fuzzysort.highlight(poj_normalized_pre_highlight,
                "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.n;
            const poj_normalized = "(" + poj_norm_pre_paren + ")";
            const english = fuzzysort.highlight(english_pre_highlight,
                "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.e;
            const poj_unicode = fuzzysort.highlight(poj_unicode_pre_highlight,
                "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.p;

            const hoabun = fuzzysort.highlight(hoabun_pre_highlight,
                "<span class=\"hoabun-matched-text\" class=hlsearch>", "</span>")
                || fuzzysort_result.obj.h;

            const loc_props = {
                key: i, // NOTE: still unused
                poj_unicode_text: fuzzysort_result.obj.p,
                poj_unicode,
                hoabun,
                poj_normalized,
                english,
            }

            return <EntryContainer {...loc_props} />;
        })
    debugConsole.timeEnd("parseFuzzySortResultsForRender");
    return currentResultsElements;
}
