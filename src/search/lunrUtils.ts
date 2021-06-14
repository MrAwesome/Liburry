import lunr from "lunr";

import type {DBEntry} from "../common/dbTypes";
import {DBName, SearchResultEntry} from "../types/dbTypes";

// TODO: cleanup
// TODO: make not lunr-specific (just pass in score)
// TODO: have DBName be replaced with an enum, and match here to determine how definitions/etc should be displayed?
//          or finally just have multiple definitions, and display them appropriately?
export function vanillaDBEntryToResult(dbName: DBName, entry: DBEntry, lunrEntry: lunr.Index.Result): SearchResultEntry {
    const rowID = entry.id;
    return {
        key: dbName + "-" + rowID,
        dbID: entry.id,
        dbName,
        dbSearchRanking: lunrEntry.score,
        pojUnicodeText: entry.poj_unicode,
        pojUnicodePossibleMatch: entry.poj_unicode,
        pojInputPossibleMatch: entry.poj_input,
        hoabunPossibleMatch: entry.hoabun,
        pojNormalizedPossibleMatch: entry.poj_normalized,
        definitionPossibleMatch: entry.english,
    } as SearchResultEntry;
}
