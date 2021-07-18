import papaparse from "papaparse";
import {DBColName, DBFullName, DisplayReadyField, SearchResultEntry} from "../types/dbTypes";

export type DBColType = string;
export type DBLangType = string;

export interface DBColumnMetadataRaw {
    db: DBFullName,
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

    getDBFullName(): DBFullName {
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

function isMyNotAPromise(obj: any): obj is NotAPromise {
    return (obj as NotAPromise).isReal !== undefined;
}

export type PromHolderState<T> =
    {state: "uninitialized"} |
    {state: "loading", promise: Promise<T>} |
    {state: "loaded", value: T};

export class PromHolder<T extends NotAPromise> {
    state: PromHolderState<T>;
    constructor(
        val: T | Promise<T> | null,
    ) {
        this.setPromise = this.setPromise.bind(this);
        this.setValue = this.setValue.bind(this);
        if (val === null) {
            this.state = {state: "uninitialized"}
        } else if (!isMyNotAPromise(val)) {
            const promise = val as Promise<T>
            this.state = {state: "loading", promise};
            promise.then((value) => this.setValue(value));
        } else {
            this.state = {state: "loaded", value: val as T};
        }
    }

    setPromise(promise: Promise<T>) {
        this.state = {state: "loading", promise};
        promise.then((value) => this.setValue(value));
    }

    setValue(value: T) {
        this.state = {state: "loaded", value};
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
    private readonly classificationsMap: Map<DBFullName, DBColumnMetadata[]>;

    private constructor(classifications: DBColumnMetadataRaw[]) {
        this.classificationsMap = new Map();

        classifications.forEach((cRaw) => {
            const meta = DBColumnMetadata.from(cRaw);
            const dbFullName = meta.getDBFullName();
            let dbCols = this.classificationsMap.get(dbFullName) ?? [];
            this.classificationsMap.set(dbFullName, [...dbCols, meta]);
        });
    }

    // TODO: handle error?
    static async fetch(url: string = DEFAULT_FIELD_CLASSIFICATION_DB): Promise<FieldClassificationHandler> {
        return papaParsePromise(url).then((res) => new FieldClassificationHandler(res.data));
    }

    static async fromText(text: string): Promise<FieldClassificationHandler> {
        return papaTextPromise(text).then((res) => new FieldClassificationHandler(res.data));
    }

    // TODO: Handle error more gracefully?
    get(dbFullName: DBFullName): DBColumnMetadata[] {
        const res = this.classificationsMap.get(dbFullName);
        if (res === undefined) {
            throw new Error(`Unknown DB: ${dbFullName}`);
        } else {
            return res;
        }
    }

    getColumnMetadata(dbFullName: DBFullName, colName: DBColName): DBColumnMetadata {
        const allCols = this.get(dbFullName);
        const meta = allCols.find((c) => c.getColumnName() === colName);

        if (meta !== undefined) {
            return meta;
        } else {
            throw new Error(`No metadata for field "${colName}" in DB "${dbFullName}"!`);
        }
    }

    getAllLangs(entry: SearchResultEntry): DBLangType[] {
        const langs: Set<DBLangType> = new Set();
        this.get(entry.getDBFullName()).forEach((col) => langs.add(col.getLanguage()));
        return Array.from(langs);
    }

    getFieldsOfType(entry: SearchResultEntry, unspType: DBColType | DBColType[]): DisplayReadyField[] {
        let dataTypes = Array.isArray(unspType) ? unspType : [unspType];
        const dbFullName = entry.getDBFullName();
        const colsOfType: DBColumnMetadata[] = this.get(dbFullName).filter(
            (col) => dataTypes.includes(col.getDataType()));
        return entry.getFields().filter(
            (field) => colsOfType.find(
                (col) => col.getColumnName() === field.getColumnName()
            ));
    }

    // TODO: store these in yaml/etc (probably per-db, or at least with the option of override), instead of here
    getAltTextsINCOMPLETE(entry: SearchResultEntry): DisplayReadyField[] {
        return this.getFieldsOfType(entry, ["input", "normalized"]);
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
