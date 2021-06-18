import fs from 'fs';
import papaparse from "papaparse";
import fetch from "node-fetch";
import {LangDB} from '../types/dbTypes';
import {DATABASES} from "../searchSettings";
import type {DBEntry, UnpreparedDBEntry} from "../common/dbTypes";
import {fromPojUnicodeToPojNormalized} from './languageUtils';

import lunr from 'lunr';
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.zh")(lunr);
require("lunr-languages/lunr.multi")(lunr);

// TODO: type "any" usage below

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

function processCSV(text: string): DBEntry[] {
    text = text.replace(/^\uFEFF/, "");
    const csv = papaparse.parse<UnpreparedDBEntry>(text, {header: true, skipEmptyLines: true});
    csv.data.forEach((entry, index) => {
        const pojNormalized = fromPojUnicodeToPojNormalized(entry.poj_unicode);
        csv.data[index] = {...csv.data[index], poj_normalized: pojNormalized} as DBEntry;
    });

    const processed = csv.data as DBEntry[];

    return processed;
}

function writeLunrIndex(langDB: LangDB, entries: DBEntry[]) {
    const idx = lunr(function () {
        // @ts-ignore lunr-languages doesn't have types defined
        this.use(lunr.multiLanguage('en', 'zh'));
        this.ref("id");
        this.field("english");
        this.field("poj_unicode");
        this.field("poj_normalized");
        this.field("hoabun");
        this.field("poj_input");

        entries.forEach((entry: DBEntry) => {
            this.add(entry)
        }, this)
    });
    const jsonText = JSON.stringify(idx);
    fs.writeFile(
        `${OUTPUT_PREFIX}${langDB.localLunr}`,
        jsonText,
        writeFileErrHandler(`Wrote out Lunr index for: "${langDB.name}"`
        ));
}

function writeFile(langDB: LangDB, entries: DBEntry[]) {
    const newCSVText = papaparse.unparse(entries, {header: true});

    fs.writeFile(
        `${OUTPUT_PREFIX}${langDB.localCSV}`,
        newCSVText,
        writeFileErrHandler(`Wrote out local CSV for: "${langDB.name}"`
        ));

}


DATABASES.forEach(async (langDB: LangDB) => {
    console.log("Started: ", langDB.name);
    const url = URL_PREFIX + langDB.upstreamCSV;

    fetch(url).then((resp) => {
        resp.text().then((text) => {
            console.log("Successfully fetched: ", langDB.name);
            const entries = processCSV(text);
            writeFile(langDB, entries);
            writeLunrIndex(langDB, entries);
        });
    });
});
