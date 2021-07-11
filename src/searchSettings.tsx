import {LangDB} from "./types/dbTypes";
import {makeNameToObjMapping} from "./utils";

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

export const RETRY_ATTEMPTS = 2;

export const SEARCH_RESULTS_LIMIT = 20;
export const DISPLAY_RESULTS_LIMIT = 20;

const POJ_UNICODE_CSV_KEY = "poj_unicode";
const POJ_NORMALIZED_CSV_KEY = "poj_normalized";
const POJ_INPUT_CSV_KEY = "poj_input";
const DEFINITION_CSV_KEY = "english";
const HOABUN_CSV_KEY = "hoabun";

// XXX TODO: determine programmatically
export const FIELDS_TO_SEARCH = [
    POJ_UNICODE_CSV_KEY,
    POJ_NORMALIZED_CSV_KEY,
    POJ_INPUT_CSV_KEY,
    DEFINITION_CSV_KEY,
    HOABUN_CSV_KEY,
];

// TODO: dynamically generate filenames etc
const CTD = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/blob/master/README.md";
export const DATABASES: Map<string, LangDB> = makeNameToObjMapping([
    {
        name: "maryknoll",
        upstreamCSV: "ChhoeTaigi_MaryknollTaiengSutian.csv",
        localCSV: "/db/maryknoll.csv",
        localLunr: "/db/maryknoll.lunr.json?v=2",
        fullName: "ChhoeTaigi_MaryknollTaiengSutian",
        dbDescLink: `${CTD}#3-1976-maryknoll%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
    },
    {
        name: "embree",
        upstreamCSV: "ChhoeTaigi_EmbreeTaiengSutian.csv",
        localCSV: "/db/embree.csv",
        localLunr: "/db/embree.lunr.json?v=2",
        fullName: "ChhoeTaigi_EmbreeTaiengSutian",
        dbDescLink: `${CTD}#4-1973-embree%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
    },
    {
        name: "giku",
        upstreamCSV: "ChhoeTaigi_TaioanPehoeKichhooGiku.csv",
        localCSV: "/db/giku.csv",
        localLunr: "/db/giku.lunr.json?v=2",
        fullName: "ChhoeTaigi_TaioanPehoeKichhooGiku",
        dbDescLink: `${CTD}#8-1956-%E5%8F%B0%E7%81%A3%E7%99%BD%E8%A9%B1%E5%9F%BA%E7%A4%8E%E8%AA%9E%E5%8F%A5`,
    },
]
);
