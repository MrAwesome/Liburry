import {DBSearchRanking} from "../search";
import {DBShortName, DBFullName, DBRow, getDBRowKeys, SearchResultEntryRaw} from "../types/dbTypes";

// TODO: have DBName be replaced with an enum, and match here to determine how definitions/etc should be displayed?
//          or finally just have multiple definitions, and display them appropriately?
export function vanillaDBEntryToResult(
    dbName: DBShortName,
    dbFullName: DBFullName,
    row: DBRow,
    dbSearchRanking: DBSearchRanking
): SearchResultEntryRaw {
    const rowID = row.id;

    const keys = getDBRowKeys(row);
    const fields = keys.map((k) => ({
        colName: k,
        value: row[k],
        matched: false,
    }));

    return {
        key: dbName + "-" + rowID,
        rowID: parseInt(row.id),
        dbName,
        dbFullName,
        dbSearchRanking,
        fields,
    } as SearchResultEntryRaw;
}
