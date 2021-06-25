import {LangDB, SearchPreppedKey} from "./types/dbTypes";
import type {FuzzyKeysOptions} from "./types/fuzzySortTypes";
import {makeNameToObjMapping} from "./utils";

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

export const RETRY_ATTEMPTS = 2;

const SEARCH_RESULTS_LIMIT = 20;
export const DISPLAY_RESULTS_LIMIT = 20;

const PREPPED_KEY_SUFFIX = "_zzprepped"

const POJ_UNICODE_CSV_KEY = "poj_unicode";
const POJ_NORMALIZED_CSV_KEY = "poj_normalized";
const POJ_INPUT_CSV_KEY = "poj_input";
const DEFINITION_CSV_KEY = "english";
const HOABUN_CSV_KEY = "hoabun";

// TODO: abstract away the process of adding keys and getting their indices
const FIELDS_TO_SEARCH = [
    POJ_UNICODE_CSV_KEY,
    POJ_NORMALIZED_CSV_KEY,
    POJ_INPUT_CSV_KEY,
    DEFINITION_CSV_KEY,
    HOABUN_CSV_KEY,
];

const PREPPED_FIELDS = FIELDS_TO_SEARCH.map((e) => e + PREPPED_KEY_SUFFIX);

const CSV_KEY_MAP_ARRAY: Array<[string, string]> = FIELDS_TO_SEARCH.map((field, i) => [field, PREPPED_FIELDS[i]]);

const DEFAULT_CSV_KEY_TO_PREPPED_NAME_MAPPING: Map<string, string> = new Map(CSV_KEY_MAP_ARRAY);

// TODO:::: XXX: remove this, let above order be correct order and use .keys below
const DEFAULT_SEARCH_KEYS: Array<SearchPreppedKey> = Array.from(DEFAULT_CSV_KEY_TO_PREPPED_NAME_MAPPING.values());

// NOTE(@MrAwesome): per-db mapping of db -> keys -> displaycard element
export const DEFAULT_POJ_NORMALIZED_INDEX = PREPPED_FIELDS.indexOf(POJ_NORMALIZED_CSV_KEY + PREPPED_KEY_SUFFIX);
export const DEFAULT_POJ_INPUT_INDEX = PREPPED_FIELDS.indexOf(POJ_INPUT_CSV_KEY + PREPPED_KEY_SUFFIX);
export const DEFAULT_DEFINITION_INDEX = PREPPED_FIELDS.indexOf(DEFINITION_CSV_KEY + PREPPED_KEY_SUFFIX);
export const DEFAULT_POJ_UNICODE_INDEX = PREPPED_FIELDS.indexOf(POJ_UNICODE_CSV_KEY + PREPPED_KEY_SUFFIX);
export const DEFAULT_HOABUN_INDEX = PREPPED_FIELDS.indexOf(HOABUN_CSV_KEY + PREPPED_KEY_SUFFIX);

export const FUZZY_SCORE_LOWER_THRESHOLD = -1000;

function getFuzzyOpts(searchKeys: Array<string> = DEFAULT_SEARCH_KEYS): FuzzyKeysOptions {
    return {
        keys: searchKeys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: FUZZY_SCORE_LOWER_THRESHOLD,
    };
}

// TODO: dynamically generate filenames etc
const CTD = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/blob/master/README.md";
export const DATABASES: Map<string, LangDB> = makeNameToObjMapping([
    {
        name: "maryknoll",
        upstreamCSV: "ChhoeTaigi_MaryknollTaiengSutian.csv",
        localCSV: "/db/maryknoll.csv",
        localLunr: "/db/maryknoll.lunr.json?v=2",
        dbFullname: "ChhoeTaigi_MaryknollTaiengSutian",
        dbDescLink: `${CTD}#3-1976-maryknoll%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
        shortNameToPreppedNameMapping: DEFAULT_CSV_KEY_TO_PREPPED_NAME_MAPPING,
        searchKeys: DEFAULT_SEARCH_KEYS,
        fuzzyOpts: getFuzzyOpts(),
        //fields: defaultFields,
    },
    {
        name: "embree",
        upstreamCSV: "ChhoeTaigi_EmbreeTaiengSutian.csv",
        localCSV: "/db/embree.csv",
        localLunr: "/db/embree.lunr.json?v=2",
        dbFullname: "ChhoeTaigi_EmbreeTaiengSutian",
        dbDescLink: `${CTD}#4-1973-embree%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
        shortNameToPreppedNameMapping: DEFAULT_CSV_KEY_TO_PREPPED_NAME_MAPPING,
        searchKeys: DEFAULT_SEARCH_KEYS,
        fuzzyOpts: getFuzzyOpts(),
        //fields: defaultFields,
    },
    {
        name: "giku",
        upstreamCSV: "ChhoeTaigi_TaioanPehoeKichhooGiku.csv",
        localCSV: "/db/giku.csv",
        localLunr: "/db/giku.lunr.json?v=2",
        dbFullname: "ChhoeTaigi_TaioanPehoeKichhooGiku",
        dbDescLink: `${CTD}#8-1956-%E5%8F%B0%E7%81%A3%E7%99%BD%E8%A9%B1%E5%9F%BA%E7%A4%8E%E8%AA%9E%E5%8F%A5`,
        shortNameToPreppedNameMapping: DEFAULT_CSV_KEY_TO_PREPPED_NAME_MAPPING,
        searchKeys: DEFAULT_SEARCH_KEYS,
        fuzzyOpts: getFuzzyOpts(),
        //fields: defaultFields,
    },
]
);
