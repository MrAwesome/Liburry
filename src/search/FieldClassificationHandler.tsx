import papaparse from "papaparse";
import {DBColName, DBFullName, DBName, DisplayReadyField, SearchResultEntry} from "../types/dbTypes";

export type DBColType = string;
export type DBLangType = string;

export interface DBColumnMetadataRaw {
    db: DBName,
    field: DBColName,
    type: DBColType,
    lang: DBLangType,
    delim: string,
    max_length: string,
    status: string,
    notes: string,
    done: string,
}

export class DBColumnMetadata {
    private constructor(private r: DBColumnMetadataRaw) {}

    static from(r: DBColumnMetadataRaw) {
        return new DBColumnMetadata(r);
    }

    getDBName(): DBName {
        return this.r.db;
    }

    getColumnName(): DBColName {
        return this.r.field;
    }

    getDataType(): DBColType {
        return this.r.type;
    }

    getLanguage(): DBLangType {
        return this.r.lang;
    }

    getDelimiter(): string {
        return this.r.delim;
    }
}

const PAPAOPTS = {
    worker: true,
    header: true,
    skipEmptyLines: true,
};

export const DEFAULT_FIELD_CLASSIFICATION_DB = "db/field_classification.csv";


interface NotAPromise {
    isReal: boolean,
}

export type PromHolderState<T> =
    { state: "uninitialized" } |
    { state: "loading", promise: Promise<T> } |
    { state: "loaded", value: T };

export class PromHolder<T extends NotAPromise> {
    state: PromHolderState<T>;
    constructor(
        val: T | Promise<T> | null,
    ) {
        this.setPromise = this.setPromise.bind(this);
        this.setValue = this.setValue.bind(this);
        if (val === null) {
            this.state = { state: "uninitialized" }
        // TODO: better typecasting (once again, I am on a plane)
        } else if ((val as T).isReal === false) {
            const promise = val as Promise<T>
            this.state = { state: "loading", promise };
            promise.then((value) => this.setValue(value));
        } else {
            this.state = { state: "loaded", value: val as T };
        }
    }

    setPromise(promise: Promise<T>) {
        this.state = { state: "loading", promise };
        promise.then((value) => this.setValue(value));
    }

    setValue(value: T) {
        this.state = { state: "loaded", value };
    }

    isLoaded(): boolean {
        return this.state.state === "loaded";
    }

    getPromise(): Promise<T> | null {
        switch (this.state.state) {
            case "uninitialized": {
                return null;
            }
            case "loading": {
                return this.state.promise;
            }
            case "loaded": {
                const value = this.state.value;
                return new Promise(function (_nope, _naw) {
                    return value;
                });
            }
        }
    }

    getValue(): T | null {
        switch (this.state.state) {
            case "uninitialized": {
                return null;
            }
            case "loading": {
                return null
            }
            case "loaded": {
                return this.state.value;
            }
        }
    }
}

// NOTE: in the unlikely event that all of the finding this class does becomes a performance hit (it is O(N)),
//       maps of hotField -> DBColumnMetadata[] can be created for each DB
export default class FieldClassificationHandler {
    isReal = true;
    private readonly classificationsMap: Map<DBName, DBColumnMetadata[]>;

    private constructor(classifications: DBColumnMetadataRaw[]) {
        this.classificationsMap = new Map();

        classifications.forEach((cRaw) => {
            const meta = DBColumnMetadata.from(cRaw);
            const dbName = meta.getDBName();
            let dbCols = this.classificationsMap.get(dbName) ?? [];
            this.classificationsMap.set(dbName, [...dbCols, meta]);
        });

        this.getAllColumnMetadataFromEntry = this.getAllColumnMetadataFromEntry.bind(this);
    }

    // TODO: handle error?
    static async fetch(url: string = DEFAULT_FIELD_CLASSIFICATION_DB): Promise<FieldClassificationHandler> {
        return papaParsePromise(url).then((res) => new FieldClassificationHandler(res.data));
    }

    static async fromText(text: string): Promise<FieldClassificationHandler> {
        return papaTextPromise(text).then((res) => new FieldClassificationHandler(res.data));
    }

    get(dbName: DBName): DBColumnMetadata[] {
        const res = this.classificationsMap.get(dbName);
        if (res === undefined) {
            // TODO: Handle this more gracefully?
            throw new Error(`Unknown DB: ${dbName}`);
        } else {
            return res;
        }
    }

    getAllColumnMetadataFromEntry(entry: SearchResultEntry): DBColumnMetadata[] {
        return this.get(entry.getDBFullName());
    }

    getColumnMetadata(dbName: DBFullName, colName: DBColName): DBColumnMetadata {
        const allCols = this.get(dbName);
        const meta = allCols.find((c) => c.getColumnName() === colName);

        if (meta !== undefined) {
            return meta;
        } else {
            throw new Error(`No metadata for field "${colName}" in DB "${dbName}"!`);
        }
    }

    getAllLangs(dbName: DBFullName): DBLangType[] {
        const langs: Set<DBLangType> = new Set();
        this.get(dbName).forEach((col) => langs.add(col.getLanguage()));
        return Array.from(langs);
    }

    getFieldsOfType(entry: SearchResultEntry, type: DBColType): DisplayReadyField[] {
        const colsOfType: DBColumnMetadata[] = this.getAllColumnMetadataFromEntry(entry).filter((col) => col.getDataType() === type);
        return entry.getFields().filter(
            (field) => colsOfType.find(
                (col) => col.getColumnName() === field.getColumnName()
        ));
    }

    // TODO: classify poj_normalized, and use col.type in (input + typing + normalized + alternate) as alttext
    // XXX XXX
    getAltTextsINCOMPLETE(entry: SearchResultEntry): DisplayReadyField[] {
        return entry.getFields().filter((field) => (field.getColumnName() === "poj_input" || field.getColumnName() === "poj_normalized"));
    }
}

// NOTE: this manually fetches because of this bug: https://github.com/mholt/PapaParse/issues/691
async function papaParsePromise(url: string): Promise<papaparse.ParseResult<DBColumnMetadataRaw>> {
    return fetch(url).then((resp) => {
        return resp.text();
    }).then(papaTextPromise);
}

async function papaTextPromise(csvText: string): Promise<papaparse.ParseResult<DBColumnMetadataRaw>> {
    return new Promise(function (complete, error) {
        papaparse.parse<DBColumnMetadataRaw>(csvText, {
            ...PAPAOPTS,
            complete,
            error,
        });
    });
}
