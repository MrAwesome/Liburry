import papaparse from "papaparse";
import {DBEntry} from "./dbTypes";

export function getEntriesFromPreparedCSV(text: string): DBEntry[] {
  const csv = papaparse.parse<DBEntry>(text, {header: true, skipEmptyLines: true});
  return csv.data;
}
