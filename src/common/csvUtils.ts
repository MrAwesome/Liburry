import papaparse from "papaparse";
import {DBRow} from "../types/dbTypes";

export function getEntriesFromPreparedCSV(text: string): DBRow[] {
  const csv = papaparse.parse<DBRow>(text, {header: true, skipEmptyLines: true});
  return csv.data;
}
