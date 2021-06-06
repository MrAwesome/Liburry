import qs from "qs";
import ChhaTaigiOptions from "./ChhaTaigiOptions";
import {MainDisplayAreaMode} from "./types/displayTypes";

// HACK to allow web worker loader to work:
// https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/24#issuecomment-672853561
(global as any).$RefreshReg$ = () => {};
(global as any).$RefreshSig$$ = () => () => {};

// These are the actual fields used/set in the hash
const QUERY = "q";
const DEBUG = "debug";
const MAIN_MODE = "mode";

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

    updateMode(mode: MainDisplayAreaMode) {
        this.update(MAIN_MODE, MainDisplayAreaMode[mode]);
    }

    private parseInternal() {
        return qs.parse(this.getString(), QS_PARSE_OPTS);
    }

    private stringifyInternal(parsed: qs.ParsedQs) {
        return qs.stringify(parsed, QS_STRINGIFY_OPTS);
    }

    // NOTE: This function updates window.location.hash, which
    //       will trigger a state change in the main component.
    private update(field: string, value: string) {
        const parsed = this.parseInternal();
        parsed[field] = value;
        const strang = this.stringifyInternal(parsed);
        if (this.testString) {
            this.testString = strang;
        } else {
            window.location.hash = strang;
        }
    }

    parse(): ChhaTaigiOptions {
        let options = new ChhaTaigiOptions();
        const parsed = this.parseInternal();
        const q = parsed[QUERY];
        const mode = parsed[MAIN_MODE];

        options.debug = parsed[DEBUG] !== undefined;
        if (typeof q === "string") {
            options.query = q;
        }

        if (typeof mode === "string") {
            const modeUpper = mode.toUpperCase();
            if (modeUpper in MainDisplayAreaMode) {
                options.mainMode = MainDisplayAreaMode[modeUpper as keyof typeof MainDisplayAreaMode];
            }
        }

        return options;
    }
}
