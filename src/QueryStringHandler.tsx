import qs from "qs";
import ChaTaigiOptions from "./ChaTaigiOptions";

// These are the actual fields used/set in the hash
const QUERY = "q";
const DEBUG = "debug";

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

    private update(field: string, value: string) {
        const parsed = qs.parse(this.getString(), {delimiter: ';'});
        parsed[field] = value;
        const strang = qs.stringify(parsed, {delimiter: ';', encode: false});
        if (this.testString) {
            this.testString = strang;
        } else {
            window.location.hash = strang;
        }
    }

    parse(): ChaTaigiOptions {
        let options = new ChaTaigiOptions();
        const parsed = qs.parse(this.getString(), {delimiter: ';'});

        options.debug = parsed[DEBUG] !== undefined;
        const q = parsed[QUERY];
        if (typeof q === "string") {
            options.query = q;
        }

        return options;
    }
}
