import {LangDB} from "./types/dbTypes";
import {makeNameToObjMapping} from "./utils";

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

export const RETRY_ATTEMPTS = 2;

export const SEARCH_RESULTS_LIMIT = 20;
export const DISPLAY_RESULTS_LIMIT = 20;

// XXX TODO: determine programmatically
// TODO: until agnostic is launched, this shouldn't be default?
export const FIELDS_TO_SEARCH = [
    "poj_unicode",
    "poj_normalized",
    "poj_input",
    "english",
    "hoabun",
];

// TODO: dynamically generate filenames and versions
const CTD = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/blob/master/README.md";
export const DATABASES: Map<string, LangDB> = makeNameToObjMapping([
    {
        shortName: "maryknoll",
        fullName: "ChhoeTaigi_MaryknollTaiengSutian",
        localCSV: "/db/maryknoll.csv",
        localCSVVersion: 3,
        localLunr: "/db/maryknoll.lunr.json",
        localLunrVersion: 3,
        upstreamCSV: "ChhoeTaigi_MaryknollTaiengSutian.csv",
        dbDescLink: `${CTD}#3-1976-maryknoll%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
    },
    {
        shortName: "embree",
        fullName: "ChhoeTaigi_EmbreeTaiengSutian",
        localCSV: "/db/embree.csv",
        localCSVVersion: 3,
        localLunr: "/db/embree.lunr.json",
        localLunrVersion: 3,
        upstreamCSV: "ChhoeTaigi_EmbreeTaiengSutian.csv",
        dbDescLink: `${CTD}#4-1973-embree%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
    },
    {
        shortName: "giku",
        fullName: "ChhoeTaigi_TaioanPehoeKichhooGiku",
        localCSV: "/db/giku.csv",
        localCSVVersion: 3,
        localLunr: "/db/giku.lunr.json",
        localLunrVersion: 3,
        upstreamCSV: "ChhoeTaigi_TaioanPehoeKichhooGiku.csv",
        dbDescLink: `${CTD}#8-1956-%E5%8F%B0%E7%81%A3%E7%99%BD%E8%A9%B1%E5%9F%BA%E7%A4%8E%E8%AA%9E%E5%8F%A5`,
    },
    {
        shortName: "sekin",
        fullName: "ChhoeTaigi_BanglooMuitheSekin",
        localCSV: "/db/sekin.csv",
        localCSVVersion: 2,
        localLunr: "/db/sekin.lunr.json",
        localLunrVersion: 1,
        upstreamCSV: "ChhoeTaigi_BanglooMuitheSekin.csv",
        ///XXX TODO: add
        dbDescLink: `${CTD}`
    },
]);
