import fs from 'fs';
import papaparse from "papaparse";
import fetch from "node-fetch";
import {LangDB, DBRow} from '../types/dbTypes';
import {DATABASES} from "../searchSettings";
import {fromKipUnicodeToKipNormalized, fromPojUnicodeToPojNormalized} from './languageUtils';

import lunr from 'lunr';
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.zh")(lunr);
require("lunr-languages/lunr.multi")(lunr);

// NOTE: You can run this code using: `yarn run webpack --config webpack.scripts.js && node build/server.js`
// TODO: type "any" usage below
// TODO: unit test?

//const langUtils = require("./languageUtils");
//const {DATABASES} = require("../searchSettings");

const URL_PREFIX = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/raw/master/ChhoeTaigiDatabase/";
const OUTPUT_PREFIX = "public";

function writeFileErrHandler(succMsg: string) {
    return (err: any) => {
        if (err) {
            console.error(err);
            process.exit(1);
        } else {
            console.log(succMsg);
        }
    }
}

function processCSV(text: string): DBRow[] {
    text = text.replace(/^\uFEFF/, "");
    const csv = papaparse.parse<DBRow>(text, {header: true, skipEmptyLines: true});
    csv.data.forEach((entry, index) => {
        // TODO: fail if entry doesn't have poj_unicode?
        const pojNormalized = fromPojUnicodeToPojNormalized(entry["poj_unicode"]);
        const kipNormalized = fromKipUnicodeToKipNormalized(entry["kip_unicode"]);
        csv.data[index] = {...csv.data[index], poj_normalized: pojNormalized, kip_normalized: kipNormalized} as DBRow;
    });

    const processed = csv.data as DBRow[];

    return processed;
}

function writeLunrIndex(langDB: LangDB, entries: DBRow[]) {
    const idx = lunr(function () {
        // @ts-ignore lunr-languages doesn't have types defined
        this.use(lunr.multiLanguage('en', 'zh'));
        this.ref("id");
        this.field("english");
        this.field("poj_unicode");
        this.field("poj_normalized");
        this.field("hoabun");
        this.field("poj_input");

        entries.forEach((entry: DBRow) => {
            this.add(entry)
        }, this)
    });
    const jsonText = JSON.stringify(idx);
    fs.writeFile(
        `${OUTPUT_PREFIX}${langDB.localLunr}`,
        jsonText,
        writeFileErrHandler(`Wrote out Lunr index for: "${langDB.shortName}"`
        ));
}

function writeFile(langDB: LangDB, entries: DBRow[]) {
    const newCSVText = papaparse.unparse(entries, {header: true});

    fs.writeFile(
        `${OUTPUT_PREFIX}${langDB.localCSV}`,
        newCSVText,
        writeFileErrHandler(`Wrote out local CSV for: "${langDB.shortName}"`
        ));

}


DATABASES.forEach(async (langDB: LangDB) => {
    console.log("Started: ", langDB.shortName);
    const url = URL_PREFIX + langDB.upstreamCSV;

    fetch(url).then((resp) => {
        resp.text().then((text) => {
            console.log("Successfully fetched: ", langDB.shortName);
            const entries = processCSV(text);
            writeFile(langDB, entries);
            writeLunrIndex(langDB, entries);
        });
    });
});
