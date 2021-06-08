import {JSONDBKey, LangDB, SearchPreppedKey} from "./types/dbTypes";
import type {FuzzyKeysOptions} from "./types/fuzzySortTypes";

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

export const RETRY_ATTEMPTS = 2;

const SEARCH_RESULTS_LIMIT = 20;
export const DISPLAY_RESULTS_LIMIT = 20;

const POJ_UNICODE_PREPPED_KEY = "poj_prepped";
const POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
const POJ_INPUT_PREPPED_KEY = "poj_input_prepped";
const DEFINITION_PREPPED_KEY = "def_prepped";
const HOABUN_PREPPED_KEY = "hoa_prepped";

const POJ_UNICODE_SHORTNAME: JSONDBKey = "p";
const POJ_NORMALIZED_SHORTNAME: JSONDBKey = "n";
const POJ_INPUT_SHORTNAME: JSONDBKey = "i";
const DEFINITION_SHORTNAME: JSONDBKey = "e";
const HOABUN_SHORTNAME: JSONDBKey = "h";

const DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING: Map<string, string> = new Map([
    [POJ_UNICODE_SHORTNAME, POJ_UNICODE_PREPPED_KEY],
    [POJ_NORMALIZED_SHORTNAME, POJ_NORMALIZED_PREPPED_KEY],
    [POJ_INPUT_SHORTNAME, POJ_INPUT_PREPPED_KEY],
    [DEFINITION_SHORTNAME, DEFINITION_PREPPED_KEY],
    [HOABUN_SHORTNAME, HOABUN_PREPPED_KEY],
]);

// TODO:::: XXX: remove this, let above order be correct order and use .keys below
const DEFAULT_SEARCH_KEYS: Array<SearchPreppedKey> = Array.from(DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING.values());

// NOTE(@MrAwesome): per-db mapping of db -> keys -> displaycard element
export const DEFAULT_POJ_NORMALIZED_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
export const DEFAULT_POJ_INPUT_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_INPUT_PREPPED_KEY);
export const DEFAULT_DEFINITION_INDEX = DEFAULT_SEARCH_KEYS.indexOf(DEFINITION_PREPPED_KEY);
export const DEFAULT_POJ_UNICODE_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
export const DEFAULT_HOABUN_INDEX = DEFAULT_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);

export const FUZZY_SCORE_LOWER_THRESHOLD = -1000;

function getFuzzyOpts(searchKeys: Array<string> = DEFAULT_SEARCH_KEYS): FuzzyKeysOptions {
    return {
        keys: searchKeys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: FUZZY_SCORE_LOWER_THRESHOLD,
    };
}

const CTD = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/blob/master/README.md";
export const DATABASES: Map<string, LangDB> = new Map([
    ["maryknoll",
        {
            dbFilename: "/db/maryknoll.json",
            dbFilenameFuzzyPrepped: "/db/maryknollPrepped.json",
            dbFullname: "ChhoeTaigi_MaryknollTaiengSutian",
            dbDescLink: `${CTD}#3-1976-maryknoll%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
    ["embree",
        {
            dbFilename: "/db/embree.json",
            dbFilenameFuzzyPrepped: "/db/embreePrepped.json",
            dbFullname: "ChhoeTaigi_EmbreeTaiengSutian",
            dbDescLink: `${CTD}#4-1973-embree%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
    ["giku",
        {
            dbFilename: "/db/giku.json",
            dbFilenameFuzzyPrepped: "/db/gikuPrepped.json",
            dbFullname: "ChhoeTaigi_TaioanPehoeKichhooGiku",
            dbDescLink: `${CTD}#8-1956-%E5%8F%B0%E7%81%A3%E7%99%BD%E8%A9%B1%E5%9F%BA%E7%A4%8E%E8%AA%9E%E5%8F%A5`,
            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
]);

// NOTE: work in progress.
//export const _CSV_DATABASES: Map<string, LangDB> = new Map([
//    ["maryknoll",
//        {
//            dbFilename: "/db/ChhoeTaigi_MaryknollTaiengSutian.csv",
//            dbFullname: "ChhoeTaigi_MaryknollTaiengSutian",
//            dbDescLink: `${CTD}#3-1976-maryknoll%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
//            // langDB: {
//            //   name: "fake_maryknoll_w_definitions"
//            // fields: [
//            //     {
//            //       name: "pojUnicode",
//            //       lang: Langs.POJ,
//            //       area: "key",
//            //       priority: 0,
//            //     },
//            //     // TODO: settings for showing/indexing these only if they're requested
//            //     {
//            //       name: "kipUnicode",
//            //       lang: Langs.KIP,
//            //       area: "key",
//            //       priority: 1,
//            //     },
//            //     {
//            //       name: "english",
//            //       lang: Langs.ENGLISH,
//            //       area: "definition",
//            //       priority: 0,
//            //     },
//            //     {
//            //       name: "english_soatbeng",
//            //       lang: Langs.ENGLISH,
//            //       area: "explanation",
//            //       priority: 0,
//            //     },
//            //     {
//            //       name: "hoabun",
//            //       lang: Langs.MANDO,
//            //       area: "definition",
//            //       priority: 1,
//            //     },
//            //     {
//            //       name: "pojTypingInput",
//            //       lang: Langs.POJ_TYPING_INPUT,
//            //       area: "alt-text",
//            //       priority: 0,
//            //     },
//            //     {
//            //       name: "pojNormalized",
//            //       lang: Langs.POJ_NORMALIZED,
//            //       area: "alt-text",
//            //       priority: 2,
//            //     },
//            //
//            // ]
//            shortNameToPreppedNameMapping: new Map([
//                [POJ_UNICODE_SHORTNAME, POJ_UNICODE_PREPPED_KEY],
//                [POJ_NORMALIZED_SHORTNAME, POJ_NORMALIZED_PREPPED_KEY],
//                [POJ_INPUT_SHORTNAME, POJ_INPUT_PREPPED_KEY],
//                [DEFINITION_SHORTNAME, DEFINITION_PREPPED_KEY],
//                [HOABUN_SHORTNAME, HOABUN_PREPPED_KEY],
//            ]),
//            searchKeys: DEFAULT_SEARCH_KEYS,
//            fuzzyOpts: getFuzzyOpts(),
//        }],
//    ["embree",
//        {
//            dbFilename: "/db/ChhoeTaigi_EmbreeTaiengSutian.csv",
//            dbFullname: "ChhoeTaigi_EmbreeTaiengSutian",
//            dbDescLink: `${CTD}#4-1973-embree%E5%8F%B0%E8%8B%B1%E8%BE%AD%E5%85%B8`,
//            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
//            searchKeys: DEFAULT_SEARCH_KEYS,
//            fuzzyOpts: getFuzzyOpts(),
//        }],
//    ["giku",
//        {
//            dbFilename: "/db/ChhoeTaigi_TaioanPehoeKichhooGiku.csv",
//            dbFullname: "ChhoeTaigi_TaioanPehoeKichhooGiku",
//            dbDescLink: `${CTD}#8-1956-%E5%8F%B0%E7%81%A3%E7%99%BD%E8%A9%B1%E5%9F%BA%E7%A4%8E%E8%AA%9E%E5%8F%A5`,
//            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
//            searchKeys: DEFAULT_SEARCH_KEYS,
//            fuzzyOpts: getFuzzyOpts(),
//        }],
//]);
