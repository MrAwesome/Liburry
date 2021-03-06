import papaparse from "papaparse";
import {RawDBRow} from "../types/dbTypes";

// NOTE: Intended to be used from a web worker, hence this does not have {worker: true}
// NOTE 2: To save memory in the app (most likely at the expense of some speed of parsing),
//         you can use the step/chunk function to filter out empty columns
export function getEntriesFromPreparedCSV(text: string): RawDBRow[] {
  const csv = papaparse.parse<RawDBRow>(text, {header: true, skipEmptyLines: true});
  return csv.data;
}
