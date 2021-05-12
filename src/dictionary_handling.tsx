import fuzzysort from "fuzzysort";

import debugConsole from "./debug_console"
import {LangDB, RawJSONEntry, SearchableDict, PreparedSearchableEntry} from "./types";

export async function fetchDB(
    dbName: string,
    langDB: LangDB,
    ): Promise<SearchableDict> {

    const {dbFilename, shortNameToPreppedNameMapping} = langDB;
    debugConsole.time("fetch-" + dbName);
    return fetch(dbFilename)
        .then((response: Response) => {
            debugConsole.timeEnd("fetch-" + dbName);
            debugConsole.time("jsonConvert-" + dbName);
            return response.json();
        })
        .then((prePreparedData: RawJSONEntry[]) => {
            debugConsole.timeEnd("jsonConvert-" + dbName);
            debugConsole.time("prepareSlow-" + dbName);
            // For each dictionary entry, prepare a fast search version of each searchable key
            const data = prePreparedData.map(
                // NOTE: this modifies the PrePreparedEntry by adding fields for each prepped key, 
                // then returning it as a SearchableEntry
                (t: RawJSONEntry) => {
                    shortNameToPreppedNameMapping.forEach(
                        (preppedKey, shortName) => {
                            // @ts-ignore  force dynamic index
                            t[preppedKey] = 
                                // TODO: scoot this fuzzysort-specific code elsewhere to maintain separation of concerns
                                fuzzysort
                                // @ts-ignore  prepareSlow does exist
                                .prepareSlow
                                // @ts-ignore  force dynamic index
                                (t[shortName]);
                        });

                    return t as PreparedSearchableEntry;
                }
            )
            debugConsole.timeEnd("prepareSlow-" + dbName);

            return {
                dbName,
                searchableEntries: data
            } as SearchableDict;
        });
}

