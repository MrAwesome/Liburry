"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASES = exports.DEFAULT_HOABUN_INDEX = exports.DEFAULT_POJ_UNICODE_INDEX = exports.DEFAULT_ENGLISH_INDEX = exports.DEFAULT_POJ_NORMALIZED_INDEX = exports.DISPLAY_RESULTS_LIMIT = void 0;
const SEARCH_RESULTS_LIMIT = 20;
exports.DISPLAY_RESULTS_LIMIT = 20;
const POJ_UNICODE_PREPPED_KEY = "poj_prepped";
const POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
const ENGLISH_PREPPED_KEY = "eng_prepped";
const HOABUN_PREPPED_KEY = "hoa_prepped";
const POJ_UNICODE_SHORTNAME = "p";
const POJ_NORMALIZED_SHORTNAME = "n";
const ENGLISH_SHORTNAME = "e";
const HOABUN_SHORTNAME = "h";
const DEFAULT_INDEXED_KEYS = new Map([
    [POJ_UNICODE_SHORTNAME, POJ_UNICODE_PREPPED_KEY],
    [POJ_NORMALIZED_SHORTNAME, POJ_NORMALIZED_PREPPED_KEY],
    [ENGLISH_SHORTNAME, ENGLISH_PREPPED_KEY],
    [HOABUN_SHORTNAME, HOABUN_PREPPED_KEY],
]);
// TODO:::: XXX: remove this, let above order be correct order and use .keys below
const DEFAULT_SEARCH_KEYS = Array.from(DEFAULT_INDEXED_KEYS.values());
// NOTE(@MrAwesome): per-db mapping of db -> keys -> displaycard element
exports.DEFAULT_POJ_NORMALIZED_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
exports.DEFAULT_ENGLISH_INDEX = DEFAULT_SEARCH_KEYS.indexOf(ENGLISH_PREPPED_KEY);
exports.DEFAULT_POJ_UNICODE_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
exports.DEFAULT_HOABUN_INDEX = DEFAULT_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);
function getFuzzyOpts(searchKeys = DEFAULT_SEARCH_KEYS) {
    return {
        keys: searchKeys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: -10000,
    };
}
exports.DATABASES = new Map([
    ["maryknoll",
        {
            "dbFilename": "db/maryknoll.json",
            indexedKeys: DEFAULT_INDEXED_KEYS,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
    ["embree",
        {
            "dbFilename": "db/embree.json",
            indexedKeys: DEFAULT_INDEXED_KEYS,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
    ["giku",
        {
            "dbFilename": "db/giku.json",
            indexedKeys: DEFAULT_INDEXED_KEYS,
            searchKeys: DEFAULT_SEARCH_KEYS,
            fuzzyOpts: getFuzzyOpts(),
        }],
]);
