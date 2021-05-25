import fuzzysort from "fuzzysort";

import {getWorkerDebugConsole} from "./debug_console"
import {LangDB, RawJSONEntry} from "./types";
import {FuzzySearchableDict, FuzzyPreparedSearchableEntry} from "./fuzzySortTypes";

export async function fetchDB(
    dbName: string,
    langDB: LangDB,
    debug: boolean,
    ): Promise<FuzzySearchableDict> {

    const debugConsole = getWorkerDebugConsole(debug);
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

                    return t as FuzzyPreparedSearchableEntry;
                }
            )
            debugConsole.timeEnd("prepareSlow-" + dbName);

            return {
                dbName,
                searchableEntries: data
            } as FuzzySearchableDict;
        });
}
