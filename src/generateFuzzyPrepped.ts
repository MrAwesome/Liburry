import fs from 'fs';
import {convertRawJSONEntryToFuzzySortPrepared} from "./fuzzySortUtils";

import {DATABASES} from "./searchSettings";
import {RawJSONEntry} from './types/dbTypes';

console.log(process.cwd());
DATABASES.forEach((langDB, dbName) => {
    fs.readFile(`public/db/${dbName}.json`, 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        const allEntries: RawJSONEntry[] = JSON.parse(data);
        console.log(dbName);
        console.log(allEntries[0]);

        const allPrepped = allEntries.map((entry) =>
            convertRawJSONEntryToFuzzySortPrepared(
                langDB.shortNameToPreppedNameMapping,
                entry));

        const jsout = JSON.stringify(allPrepped);

        fs.writeFile(`public/db/${dbName}Prepped.json`, jsout, () => {});
    });
});

export {}
