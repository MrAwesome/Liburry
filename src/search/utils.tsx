import {DBSearchRanking} from "../search";
import {DBName, DBFullName, DBRow, getDBRowKeys, SearchResultEntryData} from "../types/dbTypes";

// TODO: have DBName be replaced with an enum, and match here to determine how definitions/etc should be displayed?
//          or finally just have multiple definitions, and display them appropriately?
export function vanillaDBEntryToResult(
    dbName: DBName,
    dbFullName: DBFullName,
    row: DBRow,
    dbSearchRanking: DBSearchRanking
): SearchResultEntryData {
    const rowID = row.id;

    const keys = getDBRowKeys(row);
    const fields = keys.map((k) => ({
        colName: k,
        value: row[k],
        matched: false,
    }));

    return {
        key: dbName + "-" + rowID,
        dbID: parseInt(row.id),
        dbName,
        dbFullName,
        dbSearchRanking,
        fields,
    } as SearchResultEntryData;
}
