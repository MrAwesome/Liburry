import * as React from "react";
import ReactDOM from "react-dom";
import fuzzysort from "fuzzysort";

import {EntryContainer, SearchBar, PlaceholderArea, ResultsArea} from "./components";

import "./cha_taigi.css";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(high): add other databases from ChhoeTaigi
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
// TODO(high): investigate more performant search solutions
// TODO(high): benchmark, evaluate search/render perf, especially with multiple databases
// TODO(high): remove parentheses from unicode, treat as separate results, chomp each result
// TODO(mid): keybinding for search (/)
// TODO(mid): instead of placeholder, use search box text, and possibly a spinner (for initial loading and search wait)
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): have GET param for search (and options?)
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

const rem_url = "maryknoll.json"

// NOTE(@MrAwesome): mapping of db -> keys -> displaycard element
const POJ_UNICODE_PREPPED_KEY = "poj_prepped";
const POJ_NORMALIZED_PREPPED_KEY = "poj_normalized_prepped";
const ENGLISH_PREPPED_KEY = "eng_prepped";
const HOABUN_PREPPED_KEY = "hoa_prepped";
const MARYKNOLL_SEARCH_KEYS = [POJ_UNICODE_PREPPED_KEY, POJ_NORMALIZED_PREPPED_KEY, ENGLISH_PREPPED_KEY, HOABUN_PREPPED_KEY];
const POJ_NORMALIZED_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(POJ_NORMALIZED_PREPPED_KEY);
const ENGLISH_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(ENGLISH_PREPPED_KEY);
const POJ_UNICODE_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(POJ_UNICODE_PREPPED_KEY);
const HOABUN_INDEX = MARYKNOLL_SEARCH_KEYS.indexOf(HOABUN_PREPPED_KEY);

interface Prepared {
    // Original target string
    readonly target: string
}

// NOTE: The keys for searchable text are so small to reduce the
//       JSON file size (full length keys add >2MB to the filesize)
interface MaryKnollSearchableEntry extends Object {
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
    readonly obj: MaryKnollSearchableEntry,
}

interface KeyResults extends ReadonlyArray<KeyResult> {
    readonly score: number
    readonly obj: MaryKnollSearchableEntry
}

interface CancelablePromise<T> extends Promise<T> {
    cancel(): void
}

class OngoingSearch {
    query: string;
    promise?: CancelablePromise<any>;
    completed: boolean;

    constructor(query: string = "", promise?: CancelablePromise<any>) {
        this.query = query;

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
        debugConsole.timeEnd("asyncSearch");
    }

    cancel(): void {
        if (this.promise && !this.isCompleted()) {
            this.promise.cancel();
            this.markCompleted();
        }
    }
}

const fuzzyopts = {
    keys: MARYKNOLL_SEARCH_KEYS,
    allowTypo: false,
    limit: SEARCH_RESULTS_LIMIT,
    threshold: -10000,
};

// TODO: Move into a utils file
interface StubConsole {
    time(label?: string): void;
    timeEnd(label?: string): void;
    log(...data: any[]): void;
}

class FakeConsole implements StubConsole {
    time(_: string) {}
    timeEnd(_: string) {}
    log(..._: any[]) {}
}

// TODO: make this use a GET flag
const DEBUG_MODE = false;
const debugConsole: any = DEBUG_MODE ? console : new FakeConsole();

class App extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            results: [],
            dictionaryDB: [],
            ongoingSearch: new OngoingSearch(),
        };
        this.onChange = this.onChange.bind(this);
        this.doSearch = this.doSearch.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.createResultsForRender = this.createResultsForRender.bind(this);
    }

    componentDidMount() {
        debugConsole.time("fetch");
        fetch(rem_url)
            .then((response) => {
                debugConsole.timeEnd("fetch");
                debugConsole.time("jsonConvert");
                return response.json();
            })
            .then((data: MaryKnollSearchableEntry[]) => {
                debugConsole.timeEnd("jsonConvert");
                debugConsole.time("prepareSlow");
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
                debugConsole.timeEnd("prepareSlow");
                debugConsole.time("setLoaded");
                this.setState({dictionaryDB: data});
                debugConsole.timeEnd("setLoaded");
            });

    }

    onChange(e: any) {
        const {dictionaryDB, ongoingSearch} = this.state;
        const {target = {}} = e;
        const {value = ""} = target;
        const query = value;

        ongoingSearch.cancel();

        if (query === "") {
            this.resetSearch();
        } else {
            this.doSearch(query, dictionaryDB);
        }
    }

    resetSearch() {
        this.setState({
            query: "",
            ongoingSearch: new OngoingSearch(),
            results: []
        });
    }

    doSearch(query: string, dictionaryDB: MaryKnollSearchableEntry[]) {
        debugConsole.time("asyncSearch");
        const newSearchPromise = fuzzysort.goAsync(
            query,
            dictionaryDB,
            fuzzyopts,
        );

        const newSearch = new OngoingSearch(query, newSearchPromise);
        newSearchPromise.then(
            raw_results => {
                newSearch.markCompleted();
                return this.createResultsForRender(
                    // @ts-ignore Deal with lack of fuzzysort interfaces
                    raw_results,
                )
            }
        ).catch(debugConsole.log);

        this.setState({
            ongoingSearch: newSearch
        });
    }

    createResultsForRender(raw_results: KeyResults[]) {
        debugConsole.time("createResultsForRender");
        const results = raw_results
            .slice(0, DISPLAY_RESULTS_LIMIT)
            .map((fuzzysort_result: KeyResults, i: number) => {
                const poj_normalized_pre_highlight = fuzzysort_result[POJ_NORMALIZED_INDEX];
                const english_pre_highlight = fuzzysort_result[ENGLISH_INDEX];
                const poj_unicode_pre_highlight = fuzzysort_result[POJ_UNICODE_INDEX];
                const hoabun_pre_highlight = fuzzysort_result[HOABUN_INDEX];

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

        debugConsole.time("createResultsForRender-setState");
        this.setState({results});
        debugConsole.timeEnd("createResultsForRender-setState");
    }

    render() {
        const {onChange} = this;
        const {results, dictionaryDB, ongoingSearch} = this.state;

        const searching = !ongoingSearch.isCompleted();
        const query = ongoingSearch.getQuery();

        return (
            <div className="App">
                <SearchBar onChange={onChange} />
                <PlaceholderArea query={query} num_results={results.length} loaded={!!dictionaryDB} searching={searching} />
                <ResultsArea results={results} />
            </div>
        );
    }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
