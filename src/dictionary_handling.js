"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDB = void 0;
const fuzzysort_1 = __importDefault(require("fuzzysort"));
const debug_console_1 = __importDefault(require("./debug_console"));
function fetchDB(dbName, langDB, appendFunc) {
    const { dbFilename, indexedKeys } = langDB;
    debug_console_1.default.time("fetch-" + dbName);
    fetch(dbFilename)
        .then((response) => {
        debug_console_1.default.timeEnd("fetch-" + dbName);
        debug_console_1.default.time("jsonConvert-" + dbName);
        return response.json();
    })
        .then((prePreparedData) => {
        debug_console_1.default.timeEnd("jsonConvert-" + dbName);
        debug_console_1.default.time("prepareSlow-" + dbName);
        // For each dictionary entry, prepare a fast search version of each searchable key
        const data = prePreparedData.map(
        // NOTE: this modifies the PrePreparedEntry by adding fields for each prepped key, 
        // then returning it as a SearchableEntry
        (t) => {
            indexedKeys.forEach((preppedKey, shortName) => {
                // @ts-ignore  force dynamic index
                t[preppedKey] =
                    // TODO: scoot this elsewhere to maintain separation of concerns
                    fuzzysort_1.default.
                        // @ts-ignore  prepareSlow does exist
                        prepareSlow(t[shortName]);
            });
            return t;
        });
        debug_console_1.default.timeEnd("prepareSlow-" + dbName);
        debug_console_1.default.time("setLoaded-" + dbName);
        appendFunc({
            dbName,
            searchableEntries: data
        });
        debug_console_1.default.timeEnd("setLoaded-" + dbName);
    });
}
exports.fetchDB = fetchDB;
