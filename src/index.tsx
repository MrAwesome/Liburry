import * as React from "react";
import ReactDOM from "react-dom";
import fuzzysort from "fuzzysort";

import {EntryContainer, SearchBar, PlaceholderArea, ResultsArea} from "./components";

import "./cha_taigi.css";

// TODO(urgent): use delimiters instead of dangerouslySetInnerHTML
// TODO(high): Migrate to TypeScript
// TODO(high): Fix clipboard notif not working on most browsers
// TODO(high): Fix typing before load not searching
// TODO(high): Copy to clipboard on click or tab-enter (allow for tab/hover enter/click focus equivalency?)
// TODO(high): have search updates appear asynchronously from typing
// TODO(high): use react-window or react-virtualized to only need to render X results at a time
// TODO(high): figure out why first search is slow, and if it can be sped up
// TODO(high): use <mark></mark> instead of individual spans
// TODO(high): create an index of all 3 categories combined, and search that as text?
// TODO(high): remove parentheses from unicode entries, treat as separate results
// TODO(high): let spaces match hyphens
// TODO(script the process of CSV -> processed JSON): remove parentheses from unicode, treat as separate results, chomp each result
// TODO(mid): keybinding for search (/)
// TODO(mid): button for "get all results", default to 10-20
// TODO(mid): visual indication that there were more results
// TODO(low): have GET param for search (and options?)
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
const EMPTY_SEARCH = {query: "", promise: null};

const rem_url = "maryknoll.json"

const SEARCH_KEYS = ["poj_normalized_prepped", "eng_prepped", "poj_prepped", "hoa_prepped"];
interface Prepared {
    // Original target string
    readonly target: string
}

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



const fuzzyopts = {
    keys: SEARCH_KEYS,
    allowTypo: true,
    limit: SEARCH_RESULTS_LIMIT,
    threshold: -10000,
};

class App extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            raw_results: [],
            results: [],
            dictionary_db: [],
            ongoing_search: EMPTY_SEARCH,
        };
        this.onChange = this.onChange.bind(this);
        this.createResultsForRender = this.createResultsForRender.bind(this);
    }

    componentDidMount() {
        fetch(rem_url)
            .then((response) => {
                return response.json();
            })
            .then((data: SearchableEntry[]) => {
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
                this.setState({
                    dictionary_db: data,
                });
            });

    }

    onChange(e: any) {
        const {dictionary_db, ongoing_search} = this.state;
        const {target = {}} = e;
        const {value = ""} = target;
        const query = value;

        if (query === "") {
            if (ongoing_search.promise != null) {
                ongoing_search.promise.cancel();
            }
            this.setState({query, searching: false, ongoing_search: EMPTY_SEARCH});
            return;
        }

        const new_search_promise = fuzzysort.goAsync(
            query,
            dictionary_db,
            fuzzyopts,
        );
        const new_search = {query, promise: new_search_promise};

        if (ongoing_search.promise != null) {
            ongoing_search.promise.cancel();
        }
        new_search.promise.cancel = new_search.promise.cancel.bind(new_search);

        new_search.promise.then(
            raw_results =>
                this.createResultsForRender(
                    // Deal with lack of fuzzysort interfaces
                    // @ts-ignore
                    raw_results,
                    query
                )).catch(console.log);

        this.setState({
            query,
            searching: true,
            ongoing_search: new_search
        });
    }

    createResultsForRender(raw_results: KeyResults[], query: string) {
        console.log("res", raw_results[0]);
        const results = raw_results
            .slice(0, DISPLAY_RESULTS_LIMIT)
            .map((fuzzysort_result: KeyResults, i: number) => {
                // NOTE: See SEARCH_KEYS for order if confused.
                const poj_normalized_pre_highlight = fuzzysort_result[0];
                const english_pre_highlight = fuzzysort_result[1];
                const poj_unicode_pre_highlight = fuzzysort_result[2];
                const hoabun_pre_highlight = fuzzysort_result[3];

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

        this.setState({results, query, searching: false});
    }

    render() {
        const {onChange} = this;
        const {results, query, dictionary_db, searching} = this.state;

        // TODO: store boolean state of loading placeholder
        return (
            <div className="App">
                <SearchBar onChange={onChange} />
                <PlaceholderArea query={query} num_results={results.length} loaded={!!dictionary_db} searching={searching} />
                <ResultsArea results={results} query={query} searching={searching} />
            </div>
        );
    }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
