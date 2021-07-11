import {DBSearchRanking} from "../search";

export type DBIdentifier = number;
export type DBName = string;
export type DBFullName = string;
export type DBFilename = string;
export type SearchPreppedKey = string;
export type EntryFieldNameToPreppedNameMapping = Map<string, SearchPreppedKey>;

export interface LangDB {
    name: DBName,
    fullName: DBFullName,
    upstreamCSV: DBFilename,
    localCSV: DBFilename,
    localLunr: DBFilename,
}

export interface LangField {
    name: string,
    lang: Langs,
    area: string, // perhaps style directly instead?
    priority: number,
}

export enum Langs {
    POJ,
    KIP,
    ENGLISH,
    MANDO,
    POJ_TYPING_INPUT,
    POJ_NORMALIZED
}

// NOTE: This type is passed back from web workers.
export interface PerDictResults {
    dbName: DBName,
    results: Array<SearchResultEntryData>,
}

// NOTE: This type is passed back from web workers. It's okay to store
// a fair amount of information here, since these are only created for
// relevant results (not every entry in the DBs)
//
// TODO: add type of search which produced this?
export type DBColName = string;
export type DBColVal = string;

export interface DisplayReadyField {
    colName: DBColName;
    value: DBColVal;
    matched: boolean;
    displayValOverride?: string;
}

export interface SearchResultEntryData {
    key: string;
    dbID: DBIdentifier;
    dbName: DBName;
    dbFullName: DBFullName;
    dbSearchRanking: DBSearchRanking;
    fields: DisplayReadyField[];
}

export class SearchResultEntry {
    readonly key;
    private constructor(
        private e: SearchResultEntryData,
    ) {
        this.key = e.key;
        this.getDisplayKey = this.getDisplayKey.bind(this);
        this.getFieldByNameDEPRECATED = this.getFieldByNameDEPRECATED.bind(this);
    }

    static from(e: SearchResultEntryData) {
        return new this(e);
    }

    getFieldByNameDEPRECATED(name: string): DisplayReadyField | null {
        return this.e.fields.find((f) => f.colName === name) ?? null;
    }

    // TODO: calculate here?
    getDisplayKey(): string {
        return this.e.key;
    }

    getDBName(): DBName {
        return this.e.dbName;
    }

    getDBID(): DBIdentifier {
        return this.e.dbID;
    }

    getRanking(): DBSearchRanking {
        return this.e.dbSearchRanking;
    }

    getFields(): DisplayReadyField[] {
        return this.e.fields;
    }
}

export interface DBRow {
    id: string,
    [s: string]: string,
}

export function getDBRowKeys(r: DBRow): (keyof DBRow)[] {
    const fields = Object.getOwnPropertyNames(r)
                        .filter((k) => k !== "id");
    return fields;
}
