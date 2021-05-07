import {JSONDBKey, KeysOptions, LangDB, SearchPreppedKey} from "./types";

const SEARCH_RESULTS_LIMIT = 20;
export const DISPLAY_RESULTS_LIMIT = 20;

const POJ_UNICODE_PREPPED_KEY = "poj_prepped";
const POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
const POJ_INPUT_PREPPED_KEY = "poj_input_prepped";
const ENGLISH_PREPPED_KEY = "eng_prepped";
const HOABUN_PREPPED_KEY = "hoa_prepped";

const POJ_UNICODE_SHORTNAME: JSONDBKey = "p";
const POJ_NORMALIZED_SHORTNAME: JSONDBKey = "n";
const POJ_INPUT_SHORTNAME: JSONDBKey = "i";
const ENGLISH_SHORTNAME: JSONDBKey = "e";
const HOABUN_SHORTNAME: JSONDBKey = "h";

const DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING: Map<string, string> = new Map([
    [POJ_UNICODE_SHORTNAME, POJ_UNICODE_PREPPED_KEY],
    [POJ_NORMALIZED_SHORTNAME, POJ_NORMALIZED_PREPPED_KEY],
    [POJ_INPUT_SHORTNAME, POJ_INPUT_PREPPED_KEY],
    [ENGLISH_SHORTNAME, ENGLISH_PREPPED_KEY],
    [HOABUN_SHORTNAME, HOABUN_PREPPED_KEY],
]);

// TODO:::: XXX: remove this, let above order be correct order and use .keys below
const DEFAULT_SEARCH_KEYS: Array<SearchPreppedKey> = Array.from(DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING.values());

// NOTE(@MrAwesome): per-db mapping of db -> keys -> displaycard element
export const DEFAULT_POJ_NORMALIZED_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
export const DEFAULT_POJ_INPUT_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_INPUT_PREPPED_KEY);
export const DEFAULT_ENGLISH_INDEX = DEFAULT_SEARCH_KEYS.indexOf(ENGLISH_PREPPED_KEY);
export const DEFAULT_POJ_UNICODE_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
export const DEFAULT_HOABUN_INDEX = DEFAULT_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);

function getFuzzyOpts(searchKeys: Array<string> = DEFAULT_SEARCH_KEYS): KeysOptions {
    return {
        keys: searchKeys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: -10000,
    };
}

export const DATABASES: Map<string, LangDB> = new Map([
    ["maryknoll",
        {
            "dbFilename": "db/maryknoll.json",
            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
    ["embree",
        {
            "dbFilename": "db/embree.json",
            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
    ["giku",
        {
            "dbFilename": "db/giku.json",
            shortNameToPreppedNameMapping: DEFAULT_SHORTNAME_TO_PREPPED_NAME_MAPPING,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
]);
