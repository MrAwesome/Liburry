import fs from 'fs';
import lunr from 'lunr';
import {normalizeSync} from "normalize-diacritics";
import papaparse from "papaparse";
import fetch from "node-fetch";
import {LangDB} from '../types/dbTypes';
import {DATABASES} from "../searchSettings";
import type {DBEntry, UnpreparedDBEntry} from "../common/dbTypes";

// TODO: type "any" usage below

//const langUtils = require("./languageUtils");
//const {DATABASES} = require("../searchSettings");

// TODO: fix imports, de-dupe from languageUtils
function fromPojUnicodeToPojNormalized(pojUnicode: string): string {
  const noNasal = pojUnicode.replace(/ⁿ/g, '');
  const noBars = noNasal.replace(/[\u030d\u0358]/g, '');
  const converted = normalizeSync(noBars);
  return converted;
}

const URL_PREFIX = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/raw/master/ChhoeTaigiDatabase/";
const OUTPUT_PREFIX = "public/db/";

function writeFileErrHandler(err: any) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}

function processCSV(text: string): DBEntry[] {
  text = text.replace(/^\uFEFF/, "");
  const csv = papaparse.parse<UnpreparedDBEntry>(text, {header: true, skipEmptyLines: true});
  csv.data.forEach((entry, index) => {
    const pojNormalized =  fromPojUnicodeToPojNormalized(entry.poj_unicode);
    csv.data[index] = {poj_normalized: pojNormalized, ...csv.data[index]} as DBEntry;
  });

  const processed = csv.data as DBEntry[];

  return processed;
}

function writeLunrIndex(langDB: LangDB, entries: DBEntry[]) {
  const idx = lunr(function () {
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
  fs.writeFile(`${OUTPUT_PREFIX}/${langDB.localLunr}`, jsonText, writeFileErrHandler);
  console.log(`Wrote out Lunr index for: "${langDB.name}"`);
}

function writeFile(langDB: LangDB, entries: DBEntry[]) {
  const newCSVText = papaparse.unparse(entries, {header: true});

  fs.writeFile(`${OUTPUT_PREFIX}/${langDB.localCSV}`, newCSVText, writeFileErrHandler);
  console.log(`Wrote out local CSV for: "${langDB.name}"`);
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
