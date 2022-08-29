// TODO: determine if lunr indices should be generated
// TODO: this code should all live in a separate repo with the yml config, and "upstreamCSV" should be stored nearby
import fs from 'fs';
import papaparse from "papaparse";
import fetch from "node-fetch";
import CompiledJSONFinalConfigHandler from '../client/configHandler/CompiledJSONFinalConfigHandler';
import DBConfig from '../client/configHandler/DBConfig';
import {OldLangDB, RawDBRow} from '../client/types/dbTypes';
import {fromKipUnicodeToKipNormalized, fromPojUnicodeToPojNormalized} from './languageUtils';

import lunr from 'lunr';
import AppConfig from '../client/configHandler/AppConfig';
import OptionsChangeableByUser from '../client/ChhaTaigiOptions';
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.zh")(lunr);
require("lunr-languages/lunr.multi")(lunr);

// NOTE: You can run this code using: `yarn run webpack --config webpack.scripts.js && node build/server.js`
// TODO: type "any" usage below
// TODO: unit test?

//const langUtils = require("./languageUtils");
//const {DATABASES} = require("../searchSettings");

const URL_PREFIX = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/raw/master/ChhoeTaigiDatabase/";
const OUTPUT_PREFIX = "public/";

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

function processCSV(text: string): RawDBRow[] {
    text = text.replace(/^\uFEFF/, "");
    const csv = papaparse.parse<RawDBRow>(text, {header: true, skipEmptyLines: true});
    csv.data.forEach((entry, index) => {
        // TODO: fail if entry doesn't have poj_unicode?
        const pojNormalized = fromPojUnicodeToPojNormalized(entry["PojUnicode"]);
        const kipNormalized = fromKipUnicodeToKipNormalized(entry["KipUnicode"]);
        csv.data[index] = {...csv.data[index], PojNormalized: pojNormalized, KipNormalized: kipNormalized} as RawDBRow;
    });

    const processed = csv.data as RawDBRow[];

    return processed;
}

function _writeLunrIndex(langDB: OldLangDB, entries: RawDBRow[]) {
    const idx = lunr(function () {
        // @ts-ignore lunr-languages doesn't have types defined
        this.use(lunr.multiLanguage('en', 'zh'));
        this.ref("DictWordID");
        this.field("EngBun");
        this.field("PojUnicode");
        this.field("PojNormalized");
        this.field("HoaBun");
        this.field("PojInput");

        entries.forEach((entry: RawDBRow) => {
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

function writeFile(dbConfig: DBConfig, entries: RawDBRow[]) {
    const newCSVText = papaparse.unparse(entries, {header: true});

    fs.writeFile(
        `${OUTPUT_PREFIX}${dbConfig.getDBLoadInfo().localCSV!}`,
        newCSVText,
        writeFileErrHandler(`Wrote out local CSV for: "${dbConfig.getDBIdentifier()}"`
        ));

}

// TODO: force this to load taigi.us from the yaml, not the json
const configHandler = new CompiledJSONFinalConfigHandler();
const configPromises = [configHandler.genLoadFinalConfigLocalUNSAFE()];
Promise.all(configPromises).then(([finalConfig]) => {
    const options = new OptionsChangeableByUser();
    const appConfig = AppConfig.from(finalConfig, {...options, appID: "taigi.us"});
    const dbConfigs = appConfig.dbConfigHandler.getAllDBConfigs();

    dbConfigs.forEach((dbConfig) => {
        console.log("Started: ", dbConfig.getDBIdentifier());
        const loadInfo = dbConfig.getDBLoadInfo().localCSV!;
        // NOTE: this is chhoetaigi specific
        const url = URL_PREFIX + loadInfo.slice(3);

        fetch(url).then((resp) => {
            resp.text().then((text) => {
                console.log("Successfully fetched: ", dbConfig.getDBIdentifier());
                const entries = processCSV(text);
                writeFile(dbConfig, entries);
                // Disabled for now
                //writeLunrIndex(langDB, entries);
            });
        });
    });
});
