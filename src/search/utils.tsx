import {DBSearchRanking} from "../search";
import {DBIdentifier} from "../types/config";
import {RawDBRow, getDBRowKeys, SearchResultEntryRaw} from "../types/dbTypes";

export function vanillaDBEntryToResult(
    dbIdentifier: DBIdentifier,
    row: RawDBRow,
    dbSearchRanking: DBSearchRanking
): SearchResultEntryRaw {
    const rowID = row.id;

    const keys = getDBRowKeys(row);
    const fields = keys.map((k) => ({
        colName: k.toString(),
        value: row[k],
        matched: false,
    }));

    return {
        key: dbIdentifier + "-" + rowID,
        rowID: parseInt(row.id),
        dbIdentifier,
        dbSearchRanking,
        fields,
    };
}
