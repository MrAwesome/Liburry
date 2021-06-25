import type {DBEntry} from "../common/dbTypes";
import {DBSearchRanking} from "../search";
import {DBName, SearchResultEntry} from "../types/dbTypes";

// TODO: have DBName be replaced with an enum, and match here to determine how definitions/etc should be displayed?
//          or finally just have multiple definitions, and display them appropriately?
export function vanillaDBEntryToResult(dbName: DBName, entry: DBEntry, dbSearchRanking: DBSearchRanking): SearchResultEntry {
    const rowID = entry.id;
    return {
        key: dbName + "-" + rowID,
        dbID: entry.id,
        dbName,
        dbSearchRanking,
        pojUnicodeText: entry.poj_unicode,
        pojUnicodePossibleMatch: entry.poj_unicode,
        pojInputPossibleMatch: entry.poj_input,
        hoabunPossibleMatch: entry.hoabun,
        pojNormalizedPossibleMatch: entry.poj_normalized,
        definitionPossibleMatch: entry.english,
    } as SearchResultEntry;
}
