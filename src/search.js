"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDB = exports.OngoingSearch = void 0;
const debug_console_1 = __importDefault(require("./debug_console"));
const fuzzysort_1 = __importDefault(require("fuzzysort"));
const search_results_entities_1 = require("./search_results_entities");
const search_options_1 = require("./search_options");
class OngoingSearch {
    constructor(dbName, query = "", promise) {
        debug_console_1.default.time("asyncSearch-" + dbName);
        this.query = query;
        this.dbName = dbName;
        if (query === "") {
            this.completed = true;
        }
        else {
            this.completed = false;
            this.promise = promise;
        }
    }
    getQuery() {
        return this.query;
    }
    isCompleted() {
        return this.completed;
    }
    markCompleted() {
        this.completed = true;
        debug_console_1.default.timeEnd("asyncSearch-" + this.dbName);
    }
    cancel() {
        if (this.promise && !this.isCompleted()) {
            this.promise.cancel();
            this.markCompleted();
        }
    }
}
exports.OngoingSearch = OngoingSearch;
// TODO: make generic and allow for multiple search types
function searchDB(searchableDict, query, appendSearchFunc, appendResultsFunc) {
    const { dbName, searchableEntries } = searchableDict;
    const langDB = search_options_1.DATABASES.get(dbName);
    if (!langDB) {
        console.log("Failed to load langDB:", dbName, search_options_1.DATABASES);
        return;
    }
    const { fuzzyOpts } = langDB;
    const newSearchPromise = fuzzysort_1.default.goAsync(query, searchableEntries, fuzzyOpts);
    const newSearch = new OngoingSearch(dbName, query, newSearchPromise);
    newSearchPromise.then(rawResults => {
        newSearch.markCompleted();
        const results = search_results_entities_1.parseFuzzySortResultsForRender(dbName, 
        // @ts-ignore Deal with lack of fuzzysort interfaces
        rawResults);
        appendResultsFunc({
            dbName,
            results
        });
    }).catch(debug_console_1.default.log);
    appendSearchFunc(newSearch);
}
exports.searchDB = searchDB;
