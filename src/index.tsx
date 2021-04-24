import * as React from "react";
import ReactDOM from "react-dom";
import fuzzysort from "fuzzysort";

import {EntryContainer, SearchBar, PlaceholderArea, ResultsArea} from "./components";
import debugConsole from "./debug_console"

import "./cha_taigi.css";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(urgent): have python handle the double-"" in the CSVs
// TODO(high): add other databases from ChhoeTaigi
//               * write out schema
//               * update conversion scripts
//               * decide on display changes for multiple DBs
// TODO(high): handle alternate spellings / parentheticals vs separate fields
// TODO(high): add copyright/about page/info
// TODO(high): Fix clipboard notif not working on most browsers
// TODO(high): Fix typing before load not searching
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): have search updates appear asynchronously from typing
// TODO(high): use react-window or react-virtualized to only need to render X results at a time
// TODO(high): use <mark></mark> instead of individual spans
// TODO(high): create an index of all 3 categories combined, and search that as text?
// TODO(high): remove parentheses from unicode entries, treat as separate results
// TODO(high): let spaces match hyphens and vice-versa
// TODO(high): investigate more performant search solutions (lunr, jssearch, etc)
// TODO(high): benchmark, evaluate search/render perf, especially with multiple databases
// TODO(high): remove parentheses from unicode, treat as separate results, chomp each result
// TODO(mid): keybinding for search (/)
// TODO(mid): "search only as fallback"
// TODO(mid): link to pleco/wiktionary for chinese characters, poj, etc
// TODO(mid): unit/integration tests
// TODO(mid): long press for copy on mobile
// TODO(mid): instead of placeholder, use search box text, and possibly a spinner (for initial loading and search wait)
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): have GET param for search (and options?)
// TODO(low): hashtag load entry (for linking)
// TODO(low): move to camelCase
// TODO(low): prettier search/load indicators
// TODO(low): store options between sessions
// TODO(low): radio buttons of which text to search
// TODO(low): hoabun text click should copy hoabun?
// TODO(low): title
// TODO(low): copyright, links, etc
// TODO(low): fix the default/preview text
// TODO(wishlist): dark mode support
// TODO(wishlist): "add to desktop" shortcut
// TODO(wishlist): non-javascript support?
// TODO(later): generalize for non-english definition

const SEARCH_RESULTS_LIMIT = 20;
const DISPLAY_RESULTS_LIMIT = 20;

type DBName = string;
type DBFilename = string;
type JSONDBKey = string;
type SearchPreppedKey = string;

const POJ_UNICODE_PREPPED_KEY = "poj_prepped";
const POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
const ENGLISH_PREPPED_KEY = "eng_prepped";
const HOABUN_PREPPED_KEY = "hoa_prepped";

const POJ_UNICODE_SHORTNAME = "p";
const POJ_NORMALIZED_SHORTNAME = "n";
const ENGLISH_SHORTNAME = "e";
const HOABUN_SHORTNAME = "h";

const DEFAULT_INDEXED_KEYS: Array<[JSONDBKey, SearchPreppedKey]> = [
    [POJ_UNICODE_SHORTNAME, POJ_UNICODE_PREPPED_KEY],
    [POJ_NORMALIZED_SHORTNAME, POJ_NORMALIZED_PREPPED_KEY],
    [ENGLISH_SHORTNAME, ENGLISH_PREPPED_KEY],
    [HOABUN_SHORTNAME, HOABUN_PREPPED_KEY],
];

const DEFAULT_SEARCH_KEYS: Array<SearchPreppedKey> = [POJ_UNICODE_PREPPED_KEY, POJ_NORMALIZED_PREPPED_KEY, ENGLISH_PREPPED_KEY, HOABUN_PREPPED_KEY];

// NOTE(@MrAwesome): mapping of db -> keys -> displaycard element
const DEFAULT_POJ_NORMALIZED_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
const DEFAULT_ENGLISH_INDEX = DEFAULT_SEARCH_KEYS.indexOf(ENGLISH_PREPPED_KEY);
const DEFAULT_POJ_UNICODE_INDEX = DEFAULT_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
const DEFAULT_HOABUN_INDEX = DEFAULT_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);

const fuzzyopts = {
    keys: DEFAULT_SEARCH_KEYS,
    allowTypo: false,
    limit: SEARCH_RESULTS_LIMIT,
    threshold: -10000,
};

function getFuzzyOpts(searchKeys: Array<string> = DEFAULT_SEARCH_KEYS): object {
    return {
        keys: searchKeys,
        allowTypo: false,
        limit: SEARCH_RESULTS_LIMIT,
        threshold: -10000,
    };
}

interface LangDB {
    dbName: DBName,
    db_filename: DBFilename,
    indexed_keys: Array<[JSONDBKey, SearchPreppedKey]>,
    search_keys: Array<SearchPreppedKey>,
    fuzzy_opts: object,
}

const DATABASES: Array<LangDB> = [
    {
        "dbName": "maryknoll",
        "db_filename": "db/maryknoll.json",
        indexed_keys: DEFAULT_INDEXED_KEYS,
        search_keys: DEFAULT_SEARCH_KEYS,
        fuzzy_opts: getFuzzyOpts(),
    },
    {
        "dbName": "embree",
        "db_filename": "db/embree.json",
        indexed_keys: DEFAULT_INDEXED_KEYS,
        search_keys: DEFAULT_SEARCH_KEYS,
        fuzzy_opts: getFuzzyOpts(),
    },
    {
        "dbName": "giku",
        "db_filename": "db/giku.json",
        indexed_keys: DEFAULT_INDEXED_KEYS,
        search_keys: DEFAULT_SEARCH_KEYS,
        fuzzy_opts: getFuzzyOpts(),
    },
]

interface Prepared {
    // Original target string
    readonly target: string
}

// NOTE: The keys for searchable text are so small to reduce the
//       JSON file size (full length keys add >2MB to the filesize)
interface SearchableEntry extends Object {
    readonly e: string,
    eng_prepped: Prepared,
    readonly p: string,
    poj_prepped: Prepared,
    readonly n: string,
    poj_normalized_prepped: Prepared,
    readonly h: string,
    hoa_prepped: Prepared,
}

interface Result {
    readonly score: number,
    readonly target: string,
    readonly indexes: number[],
}

interface KeyResult extends Result {
    readonly obj: SearchableEntry,
}

interface KeyResults extends ReadonlyArray<KeyResult> {
    readonly score: number
    readonly obj: SearchableEntry
}

interface CancelablePromise<T> extends Promise<T> {
    cancel(): void
}

class OngoingSearch {
    dbName: DBName;
    query: string;
    promise?: CancelablePromise<any>;
    completed: boolean;

    constructor(dbName: DBName, query: string = "", promise?: CancelablePromise<any>) {
        debugConsole.time("asyncSearch-" + dbName);
        this.query = query;
        this.dbName = dbName;

        if (query === "") {
            this.completed = true;
        } else {
            this.completed = false;
            this.promise = promise;
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
        debugConsole.timeEnd("asyncSearch-" + this.dbName);
    }

    cancel(): void {
        if (this.promise && !this.isCompleted()) {
            this.promise.cancel();
            this.markCompleted();
        }
    }
}

interface SearchableDict {
    dbName: DBName,
    searchableEntries: Array<SearchableEntry>,
}

// TODO: instead of this, tag all results with their relevant dict?
// TODO: sort all results by overall relevance somehow?
// TODO: combine overlapping results, etc
interface PerDictResultsElements {
    dbName: DBName,
    results: Array<JSX.Element>,
    // TODO: store the intermediate results for each search as well?
}

class IntermediatePerDictResultsElements extends React.Component<any, any> {
    render() {
        const {perDictRes} = this.props;
        const {dbName, results} = perDictRes;
        return <div className="TODO-intermediate-results">
            <div className="TODO-db-header">{dbName}</div>
            {results}
        </div>
    }

}

interface ChaTaigiState {
    query: string,
    currentResultsElements: Array<IntermediatePerDictResultsElements>,
    searchableDicts: Array<SearchableDict>,
    ongoingSearches: Array<OngoingSearch>,
}

interface ChaTaigiStateArgs {
    query?: string,
    currentResultsElements?: Array<IntermediatePerDictResultsElements>,
    searchableDicts?: Array<Array<SearchableEntry>>,
    ongoingSearches?: Array<OngoingSearch>,
}

class ChaTaigi extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            currentResultsElements: [],
            searchableDicts: [],
            ongoingSearches: [],
        };

        this.onChange = this.onChange.bind(this);
        this.doSearch = this.doSearch.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.createResultsForRender = this.createResultsForRender.bind(this);
        this.fetchDB = this.fetchDB.bind(this);
        this.searchDB = this.searchDB.bind(this);
        this.setStateTyped = this.setStateTyped.bind(this);
        this.getStateTyped = this.getStateTyped.bind(this);
        this.appendSearch = this.appendSearch.bind(this);
        this.appendDict = this.appendDict.bind(this);
        this.appendResults = this.appendResults.bind(this);
    }

    setStateTyped(state: ChaTaigiStateArgs | ((prevState: ChaTaigiState) => any)) {
        this.setState(state)
    }

    getStateTyped(): ChaTaigiState {
        return this.state as ChaTaigiState;
    }

    componentDidMount() {
        DATABASES.forEach(this.fetchDB);
    }

    fetchDB({dbName, db_filename}: LangDB) {
        debugConsole.time("fetch-" + dbName);
        fetch(db_filename)
            .then((response) => {
                debugConsole.timeEnd("fetch-" + dbName);
                debugConsole.time("jsonConvert-" + dbName);
                return response.json();
            })
            .then((data: SearchableEntry[]) => {
                debugConsole.timeEnd("jsonConvert-" + dbName);
                debugConsole.time("prepareSlow-" + dbName);
                data.forEach(
                    t => {
                        // NOTE: prepareSlow does exist.
                        // @ts-ignore
                        t.poj_prepped = fuzzysort.prepareSlow(t.p);
                        // @ts-ignore
                        t.poj_normalized_prepped = fuzzysort.prepareSlow(t.n);
                        // @ts-ignore
                        t.eng_prepped = fuzzysort.prepareSlow(t.e);
                        // @ts-ignore
                        t.hoa_prepped = fuzzysort.prepareSlow(t.h);
                    }
                )
                debugConsole.timeEnd("prepareSlow-" + dbName);

                debugConsole.time("setLoaded-" + dbName);
                this.appendDict({
                    dbName,
                    searchableEntries: data
                });
                debugConsole.timeEnd("setLoaded-" + dbName);
            });

    }

    appendDict(newDict: SearchableDict) {
        this.setStateTyped((state: ChaTaigiState) => ({searchableDicts: [...state.searchableDicts, newDict]}));
    }

    appendSearch(newSearch: OngoingSearch) {
        this.setStateTyped((state: ChaTaigiState) => ({ongoingSearches: [...state.ongoingSearches, newSearch]}));
    }

    appendResults(results: PerDictResultsElements) {
        debugConsole.time("appendResults-setState");
        const TODO_Intermediate = <IntermediatePerDictResultsElements perDictRes={results} />
        this.setStateTyped((state: ChaTaigiState) => ({currentResultsElements: [...state.currentResultsElements, TODO_Intermediate]}));
        debugConsole.timeEnd("appendResults-setState");
    }


    onChange(e: any) {
        const {searchableDicts, ongoingSearches} = this.getStateTyped();
        const {target = {}} = e;
        const {value = ""} = target;
        const query = value;

        ongoingSearches.forEach((search) => search.cancel());

        if (query === "") {
            this.resetSearch();
        } else {
            // TODO: Correct place for this?
            this.setStateTyped({query, currentResultsElements: []});
            this.doSearch(query, searchableDicts);
        }
    }

    resetSearch() {
        this.setStateTyped({
            query: "",
            //
            // TODO: force cancel all existing searches
            ongoingSearches: [],
            currentResultsElements: []
        });
    }

    doSearch(query: string, searchableDicts: Array<SearchableDict>) {
        searchableDicts.forEach(({dbName, searchableEntries}) => {
            this.searchDB(dbName, query, searchableEntries);
        }
        );
    }

    // TODO: Make sure functional, move to file
    searchDB(dbName: DBName, query: string, searchableEntries: Array<SearchableEntry>) {
        const newSearchPromise = fuzzysort.goAsync(
            query,
            searchableEntries,
            fuzzyopts,
        );

        const newSearch = new OngoingSearch(dbName, query, newSearchPromise);
        newSearchPromise.then(
            raw_results => {
                newSearch.markCompleted();
                const results = this.createResultsForRender(
                    // @ts-ignore Deal with lack of fuzzysort interfaces
                    raw_results,
                );
                this.appendResults({
                    dbName,
                    results
                });

            }
        ).catch(debugConsole.log);

        this.appendSearch(newSearch);
    }

    // TODO: move into separate file
    createResultsForRender(raw_results: KeyResults[]): JSX.Element[] {
        debugConsole.time("createResultsForRender");
        const currentResultsElements = raw_results
            .slice(0, DISPLAY_RESULTS_LIMIT)
            .map((fuzzysort_result: KeyResults, i: number) => {
                // NOTE: This odd indexing is necessary because of how fuzzysort returns results. To see:
                //       console.log(fuzzysort_result)
                // TODO: per-db indexing
                const poj_normalized_pre_highlight = fuzzysort_result[DEFAULT_POJ_NORMALIZED_INDEX];
                const english_pre_highlight = fuzzysort_result[DEFAULT_ENGLISH_INDEX];
                const poj_unicode_pre_highlight = fuzzysort_result[DEFAULT_POJ_UNICODE_INDEX];
                const hoabun_pre_highlight = fuzzysort_result[DEFAULT_HOABUN_INDEX];

                const poj_norm_pre_paren = fuzzysort.highlight(poj_normalized_pre_highlight,
                    "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
                    || fuzzysort_result.obj.n;
                const poj_normalized = "(" + poj_norm_pre_paren + ")";
                const english = fuzzysort.highlight(english_pre_highlight,
                    "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
                    || fuzzysort_result.obj.e;
                const poj_unicode = fuzzysort.highlight(poj_unicode_pre_highlight,
                    "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
                    || fuzzysort_result.obj.p;

                const hoabun = fuzzysort.highlight(hoabun_pre_highlight,
                    "<span class=\"hoabun-matched-text\" class=hlsearch>", "</span>")
                    || fuzzysort_result.obj.h;

                const loc_props = {
                    key: i, // NOTE: still unused
                    poj_unicode_text: fuzzysort_result.obj.p,
                    poj_unicode,
                    hoabun,
                    poj_normalized,
                    english,
                }

                return <EntryContainer {...loc_props} />;
            })
        debugConsole.timeEnd("createResultsForRender");
        return currentResultsElements;
    }

    render() {
        const {onChange} = this;
        const {currentResultsElements, searchableDicts, ongoingSearches, query} = this.getStateTyped();

        const searching = ongoingSearches.some((s) => !s.isCompleted());

        return (
            <div className="ChaTaigi">
                <SearchBar onChange={onChange} />
                <PlaceholderArea query={query} num_results={currentResultsElements.length} loaded={!!searchableDicts} searching={searching} />
                <ResultsArea results={currentResultsElements} />
            </div>
        );
    }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<ChaTaigi />, rootElement);
