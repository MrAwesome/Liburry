import qs from "qs";
import ChaTaigiOptions from "./ChaTaigiOptions";
import {MainDisplayAreaMode} from "./types";

// These are the actual fields used/set in the hash
const QUERY = "q";
const DEBUG = "debug";
const MAIN_MODE = "mode";

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


    // TODO: allow the delimiter to be typed in search (encode it by hand?)
    private update(field: string, value: string) {
        const parsed = qs.parse(this.getString(), {delimiter: ';'});
        parsed[field] = value;
        const strang = qs.stringify(parsed, {delimiter: ';'});
        if (this.testString) {
            this.testString = strang;
        } else {
            window.location.hash = strang;
        }
    }

    parse(): ChaTaigiOptions {
        let options = new ChaTaigiOptions();
        const parsed = qs.parse(this.getString(), {delimiter: ';'});
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
