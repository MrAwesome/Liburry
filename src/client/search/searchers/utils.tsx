import {DBIdentifier} from "../../configHandler/zodConfigTypes";
import {DBSearchRanking, RawDBRow, getDBRowKeys, SearchResultEntryRaw} from "../../types/dbTypes";

export function vanillaDBEntryToResult(
    dbIdentifier: DBIdentifier,
    row: RawDBRow,
    dbSearchRanking: DBSearchRanking,
    primaryKey: string,
): SearchResultEntryRaw {
    const rowID = row[primaryKey];

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
