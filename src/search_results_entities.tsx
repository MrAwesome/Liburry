import fuzzysort from "fuzzysort";
import debugConsole from "./debug_console";
import {EntryContainer} from "./components";
import {DBName, KeyResults} from "./types";

// TODO: remove when there are other types of search
import {DEFAULT_ENGLISH_INDEX, DEFAULT_HOABUN_INDEX, DEFAULT_POJ_NORMALIZED_INDEX, DEFAULT_POJ_UNICODE_INDEX, DISPLAY_RESULTS_LIMIT} from "./search_options";

export function parseFuzzySortResultsForRender(
    dbName: DBName,
    rawResults: KeyResults[]
): JSX.Element[] {
    debugConsole.time("parseFuzzySortResultsForRender");
    const currentResultsElements = rawResults
        .slice(0, DISPLAY_RESULTS_LIMIT)
        .map((fuzzysortResult: KeyResults, _: number) => {
            const obj = fuzzysortResult.obj;
            const pojUnicodeText = obj.p;
            const rowID = obj.d;

            // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
            //       console.log(fuzzysortResult)
            //
            // TODO: per-db indexing
            const pojNormalizedPreHighlight = fuzzysortResult[DEFAULT_POJ_NORMALIZED_INDEX];
            const englishPreHighlight = fuzzysortResult[DEFAULT_ENGLISH_INDEX];
            const pojUnicodePreHighlight = fuzzysortResult[DEFAULT_POJ_UNICODE_INDEX];
            const hoabunPreHighlight = fuzzysortResult[DEFAULT_HOABUN_INDEX];

            const pojNormPreParen = fuzzysort.highlight(pojNormalizedPreHighlight,
                "<mark class=\"poj-normalized-matched-text\" class=hlsearch>", "</mark>")
                || obj.n;
            const pojNormalized = "(" + pojNormPreParen + ")";
            const english = fuzzysort.highlight(englishPreHighlight,
                "<mark class=\"english-definition-matched-text\" class=hlsearch>", "</mark>")
                || obj.e;
            const pojUnicode = fuzzysort.highlight(pojUnicodePreHighlight,
                "<mark class=\"poj-unicode-matched-text\" class=hlsearch>", "</mark>")
                || pojUnicodeText;

            const hoabun = fuzzysort.highlight(hoabunPreHighlight,
                "<mark class=\"hoabun-matched-text\" class=hlsearch>", "</mark>")
                || obj.h;

            const locProps = {
                key: dbName + "-" + rowID,
                pojUnicodeText,
                pojUnicode,
                hoabun,
                pojNormalized,
                english,
            }

            return <EntryContainer {...locProps} />;
        })
    debugConsole.timeEnd("parseFuzzySortResultsForRender");
    return currentResultsElements;
}
