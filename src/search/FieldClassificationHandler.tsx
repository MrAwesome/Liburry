import papaparse from "papaparse";
import {DBColName, DBFullName, DBName, DisplayReadyField, SearchResultEntry} from "../types/dbTypes";

const UNKNOWN_FIELDTYPE: DBColType = "unknown";

type DBColType = string;
type DBLangType = string;
export interface DBColMetadata {
    db: string,
    field: string,
    type: DBColType,
    lang: DBLangType,
    delim: string,
    max_length: string,
    status: string,
    notes: string,
    done: string,
}

const PAPAOPTS = {
    worker: true,
    header: true,
    skipEmptyLines: true,
};

export const DEFAULT_FIELD_CLASSIFICATION_DB = "db/field_classification.csv";

export default class FieldClassificationHandler {
    private readonly classificationsMap: Map<DBName, DBColMetadata[]>;

    private constructor(classifications: DBColMetadata[]) {
        this.classificationsMap = new Map();

        classifications.forEach((c) => {
            const dbName = c.db;
            let dbCols = this.classificationsMap.get(dbName) ?? [];
            this.classificationsMap.set(dbName, [...dbCols, c]);
        });
    }

    // TODO: catch error
    static async fetch(url: string = DEFAULT_FIELD_CLASSIFICATION_DB): Promise<FieldClassificationHandler> {
        return papaParsePromise(url).then((res) => new FieldClassificationHandler(res.data));
    }

    static async fromText(text: string): Promise<FieldClassificationHandler> {
        return papaTextPromise(text).then((res) => new FieldClassificationHandler(res.data));
    }

    get(dbName: DBName): DBColMetadata[] {
        const res = this.classificationsMap.get(dbName);
        if (res === undefined) {
            // XXX
            throw `Unknown DB: ${dbName}`;
        } else {
            return res;
        }
    }

    getFromEntry(entry: SearchResultEntry): DBColMetadata[] {
        return this.get(entry.getDBName());
    }

    getAllLangs(dbName: DBFullName): DBLangType[] {
        const langs: Set<DBLangType> = new Set();
        this.get(dbName).forEach((col) => langs.add(col.lang));
        return Array.from(langs);
    }

    getFieldsOfType(entry: SearchResultEntry, type: DBColType): DisplayReadyField[] {
        const colsOfType: DBColMetadata[] = this.getFromEntry(entry).filter((col) => col.type === type);
        return entry.getFields().filter(
            (field) => colsOfType.find(
                (col) => col.type === field.colName
        ));
    }

    getTypeOfField(dbName: DBFullName, colName: DBColName): DBColType {
        if (colName === "poj_normalized") {
            return "normalized";
        }

        const foundField = this.get(dbName).find((field) => field.field === colName);
        if (foundField !== undefined) {
            // XXX TODO: add to classification sheet
            return foundField.type;
        } else {
            return UNKNOWN_FIELDTYPE;
        }

    }

    // TODO: classify poj_normalized, and use col.type in (input + typing + normalized + alternate) as alttext
    getAltTextsINCOMPLETE(entry: SearchResultEntry): DisplayReadyField[] {
        return entry.getFields().filter((field) => (field.colName === "poj_input" || field.colName === "poj_normalized"));
    }
}

// NOTE: this manually fetches because of this bug: https://github.com/mholt/PapaParse/issues/691
async function papaParsePromise(url: string): Promise<papaparse.ParseResult<DBColMetadata>> {
    return fetch(url).then((resp) => {
        return resp.text();
    }).then(papaTextPromise);
}

async function papaTextPromise(csvText: string): Promise<papaparse.ParseResult<DBColMetadata>> {
    return new Promise(function (complete, error) {
        papaparse.parse<DBColMetadata>(csvText, {
            ...PAPAOPTS,
            complete,
            error,
        });
    });
}
