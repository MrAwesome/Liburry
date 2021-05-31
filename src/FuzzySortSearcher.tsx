import {FuzzySearchableDict} from "./types/fuzzySortTypes";
import {fuzzySortFetchAndPrepare, fuzzySortSearch} from "./fuzzySortUtils";
import {OngoingSearch, Searcher, SearcherType, SearchFailure} from "./search";
import {DBName, LangDB} from "./types/dbTypes";

export default class FuzzySortSearcher implements Searcher {
    searcherType = SearcherType.FuzzySort;
    dbName: DBName;
    langDB: LangDB;
    debug: boolean;

    private fuzzyDict?: FuzzySearchableDict = undefined;

    constructor(dbName: DBName, langDB: LangDB, debug: boolean) {
        this.dbName = dbName;
        this.langDB = langDB;
        this.debug = debug;
    }

    async prepare(): Promise<void> {
        return fuzzySortFetchAndPrepare(this.dbName, this.langDB, this.debug)
            .then(
                (fuzzyDict: FuzzySearchableDict) => {this.fuzzyDict = fuzzyDict;});
    }

    search(query: string): OngoingSearch | SearchFailure {
        if (this.fuzzyDict === undefined) {
            console.warn("Tried to search before preparation: ", this);
            return SearchFailure.FuzzySearchedBeforePrepare;
        } else {
            return fuzzySortSearch(this.fuzzyDict, query, this.debug)
        }
    }

}
