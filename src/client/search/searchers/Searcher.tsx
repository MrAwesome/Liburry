import getDebugConsole, {StubConsole} from "../../getDebugConsole";
import {PerDictResultsRaw, SingleDBLoadStatus} from "../../types/dbTypes";
import {CancelablePromise} from "../../types/general";
import {FuzzySortPreparer, FUZZY_SCORE_LOWER_THRESHOLD} from "./FuzzySortSearcher";
//import {LunrPreparer} from "./search/searchers/LunrSearcher";
import {DBConfig, DBIdentifier} from "../../types/config";

export abstract class SearcherPreparer {
    abstract prepare(): Promise<Searcher>;
}

export abstract class Searcher {
    // TODO: more granular search args are needed.
    abstract search(query: string): OngoingSearch | SearchFailure;
}

export enum SearcherType {
    FUZZYSORT = "FUZZYSORT",
    LUNR = "LUNR"
}

// TODO: store this information further away from this module, closer to where searchers are defined
//       (would be easiest with an abstract static, but those don't seem to exist in typescript right now)
export function getMaxScore(searcherType: SearcherType): number {
    switch (searcherType) {
        case SearcherType.FUZZYSORT:
            return FUZZY_SCORE_LOWER_THRESHOLD;
        case SearcherType.LUNR:
            throw new Error("Lunr is not currently implemented.");
            // TODO: some normalized value for this
            //return 25;
    }
}

export function getSearcherPreparer(
    searcherType: SearcherType,
    dbConfig: DBConfig,
    sendLoadStateUpdate: (stateDelta: Partial<SingleDBLoadStatus>) => void,
    debug: boolean
): SearcherPreparer {
    switch (searcherType) {
        case SearcherType.FUZZYSORT:
            return new FuzzySortPreparer(dbConfig, sendLoadStateUpdate, debug);
        case SearcherType.LUNR:
            throw new Error("Lunr is not currently implemented.");
            // TODO: implement for lunr
            //return new LunrPreparer(dbConfig, sendLoadStateUpdate, debug);
    }
}

export enum SearchFailure {
    FuzzyNoSearchableDict = "FuzzyNoSearchableDict",
    FuzzyFailedToLoadLangDB = "FuzzyFailedToLoadLangDB",
    ParsePromiseFailed = "FuzzyParsePromiseFailed",
    SearchedBeforePrepare = "SearchedBeforePrepare",
}

// TODO: type promises
export class OngoingSearch {
    dbIdentifier: DBIdentifier;
    query: string;
    searchPromise?: CancelablePromise<any>;
    parsePromise?: CancelablePromise<PerDictResultsRaw | SearchFailure>;
    completed: boolean;
    wasCanceled: boolean = false;
    console: StubConsole;

    constructor(
        dbIdentifier: DBIdentifier,
        query: string = "",
        debug: boolean,
        searchPromise?: CancelablePromise<any>,
        parsePromise?: CancelablePromise<PerDictResultsRaw | SearchFailure>,
    ) {
        this.console = getDebugConsole(debug);
        this.console.time("asyncSearch-" + dbIdentifier);
        this.query = query;
        this.dbIdentifier = dbIdentifier;

        if (query === "") {
            this.completed = true;
        } else {
            this.completed = false;
            this.searchPromise = searchPromise;
            this.parsePromise = parsePromise;
        }
    }

    getQuery(): string {
        return this.query;
    }

    isCompleted(): boolean {
        return this.completed;
    }

    markCompleted(): void {
        this.completed = true;
        this.console.timeEnd("asyncSearch-" + this.dbIdentifier);
    }

    markCanceled(): void {
        this.wasCanceled = true;
        this.markCompleted();
    }

    endTimer(): void {
    }

    cancel(): void {
        if (!this.isCompleted()) {
            if (this.searchPromise) {
                this.searchPromise.cancel();
            }
            if (this.parsePromise) {
                this.parsePromise.cancel();
            }
            this.markCanceled();
        }
    }
}
