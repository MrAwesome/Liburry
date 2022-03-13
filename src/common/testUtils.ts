import {SearcherType} from "../client/search/searchers/Searcher";
import {DBSearchRanking, PerDictResultsRaw, SearchResultEntryRaw} from "../client/types/dbTypes";

export function getExampleTaigiRes(): PerDictResultsRaw {
    const dbIdentifier = "ChhoeTaigi_TaioanPehoeKichhooGiku";
    const rowID = 1;

    const marked = `hoat-<mark>lu̍t</mark>`;

    const dbSearchRanking: DBSearchRanking = {searcherType: SearcherType.REGEX, score: -3};
    const res1: SearchResultEntryRaw = {
        key: `${dbIdentifier}-${rowID}`,
        rowID,
        dbIdentifier,
        dbSearchRanking,
        fields: [
            {
                colName: "PojUnicode",
                value: "hoat-lu̍t",
                matched: true,
                displayValOverride: marked,
            },
            {
                colName: "PojInput",
                value: "hoat-lut8",
                matched: false,
            },
            {
                colName: "HoaBun",
                value: "法律",
                matched: false,
            },
            {
                colName: "PojNormalized",
                value: "hoat-lut",
                matched: false,
            },
            {
                colName: "EngBun",
                value: "the law",
                matched: false,
            },
        ],
    };

    return {
        dbIdentifier,
        results: [res1],
    };
}
