import fuzzysort from "fuzzysort";

import debugConsole from "./debug_console"
import {LangDB, PrePreparedEntry, SearchableDict, SearchableEntry} from "./types";

export function fetchDB(
    dbName: string,
    langDB: LangDB,
    appendFunc: ((searchableDict: SearchableDict) => void)) {

    const {dbFilename, indexedKeys} = langDB;
    debugConsole.time("fetch-" + dbName);
    fetch(dbFilename)
        .then((response: Response) => {
            debugConsole.timeEnd("fetch-" + dbName);
            debugConsole.time("jsonConvert-" + dbName);
            return response.json();
        })
        .then((prePreparedData: PrePreparedEntry[]) => {
            debugConsole.timeEnd("jsonConvert-" + dbName);
            debugConsole.time("prepareSlow-" + dbName);
            // For each dictionary entry, prepare a fast search version of each searchable key
            const data = prePreparedData.map(
                // NOTE: this modifies the PrePreparedEntry by adding fields for each prepped key, 
                // then returning it as a SearchableEntry
                (t: PrePreparedEntry) => {
                    indexedKeys.forEach(
                        (preppedKey, shortName) => {
                            // @ts-ignore  force dynamic index
                            t[preppedKey] = 
                                // TODO: scoot this elsewhere to maintain separation of concerns
                                fuzzysort.
                                // @ts-ignore  prepareSlow does exist
                                prepareSlow
                                // @ts-ignore  force dynamic index
                                (t[shortName]);
                        });

                    return t as SearchableEntry;
                }
            )
            debugConsole.timeEnd("prepareSlow-" + dbName);

            debugConsole.time("setLoaded-" + dbName);
            appendFunc({
                dbName,
                searchableEntries: data
            });
            debugConsole.timeEnd("setLoaded-" + dbName);
        });

}

