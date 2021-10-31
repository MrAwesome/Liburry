import qs from "qs";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import {SearcherType} from "./search";

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

// These are the actual fields used/set in the hash
const QUERY = "q";
const DEBUG = "debug";
const SEARCHER = "searcher";
const PLAYGROUND = "playground";

const QS_SORT_FN = (a: string, b: string) => {
    if (a === b) {
        return 0;
    } else if (a === QUERY) {
        return 1;
    } else if (b === QUERY) {
        return -1;
    } else {
        return a.localeCompare(b);
    }
};

const QS_PARSE_OPTS = {delimiter: ';'};
const QS_STRINGIFY_OPTS = {delimiter: ';', sort: QS_SORT_FN};

// TODO(low): consider having the hash string be part of the app state?
export default class QueryStringParser {
    private testString?: string;
    constructor(testString?: string) {
        this.testString = testString;
    }

    getString(): string {
        return this.testString ??
            window.location.hash.replace(/^#/, "");
    }

    updateQuery(query: string) {
        this.update(QUERY, query);
    }

    saveQuery(query: string) {
        this.update(QUERY, query, true);
    }

    private parseInternal() {
        return qs.parse(this.getString(), QS_PARSE_OPTS);
    }

    private stringifyInternal(parsed: qs.ParsedQs) {
        return qs.stringify(parsed, QS_STRINGIFY_OPTS);
    }

    private update(field: string, value: string, save?: boolean) {
        const shouldSave = save ?? false;
        const parsed = this.parseInternal();
        parsed[field] = value;
        const newHashString = this.stringifyInternal(parsed);

        if (this.testString) {
            this.testString = newHashString;
        } else {
            const args: [Object, string, string] = [parsed, '', "#" + newHashString];
            if (shouldSave) {
                window.history.pushState(...args);
            } else {
                window.history.replaceState(...args);
            }
        }
    }

    parse(): OptionsChangeableByUser {
        let options = new OptionsChangeableByUser();
        const parsed = this.parseInternal();
        const q = parsed[QUERY];
        const searcher = parsed[SEARCHER];

        if (typeof q === "string") {
            options.savedQuery = q;
        }

        // TODO: abstract away this process
        options.debug = parsed[DEBUG] !== undefined;
        options.playground = parsed[PLAYGROUND] !== undefined;

        if (typeof searcher === "string") {
            const searcherUpper = searcher.toUpperCase();
            if (searcherUpper in SearcherType) {
                options.searcherType = SearcherType[searcherUpper as keyof typeof SearcherType];
            }
        }

        return options;
    }
}
