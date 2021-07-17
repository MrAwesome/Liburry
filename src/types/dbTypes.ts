import {DBSearchRanking} from "../search";
import FieldClassificationHandler, {DBColType, DBColumnMetadata} from "../search/FieldClassificationHandler";

// TODO: move the code here that isn't type-only somewhere else

export type RowIdentifier = number;
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
    localCSVVersion: number,
    localLunr: DBFilename,
    localLunrVersion: number,
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
export interface PerDictResultsRaw {
    dbName: DBName,
    results: Array<SearchResultEntryRaw>,
}

export class PerDictResults {
    private constructor(
        private dbName: DBName,
        private results: SearchResultEntry[],
    ) {
    }

    static from(allRes: PerDictResultsRaw, h: FieldClassificationHandler) {
        const results = allRes.results.map((r) => SearchResultEntry.from(r, h));
        return new PerDictResults(allRes.dbName, results);
    }

    getDBName(): DBName {
        return this.dbName;
    }

    getResults(): Array<SearchResultEntry> {
        return this.results;
    }


}

// NOTE: This type is passed back from web workers. It's okay to store
// a fair amount of information here, since these are only created for
// relevant results (not every entry in the DBs)
//
// TODO: add type of search which produced this?
export type DBColName = string;
export type DBColVal = string;

// NOTE: this class is passed from workers back to the main thread, hence interface instead of class.
export interface DisplayReadyFieldRaw {
    readonly colName: DBColName;
    readonly value: DBColVal;
    readonly matched: boolean;
    readonly displayValOverride?: string;
}

export class DisplayReadyField {
    private constructor(
        private d: DisplayReadyFieldRaw,
        private dbName: DBName,
        private metadata: DBColumnMetadata,
    ){
        this.hasValue = this.hasValue.bind(this);
        this.getDisplayValue = this.getDisplayValue.bind(this);
        this.getColumnName = this.getColumnName.bind(this);
    }

    static from(d: DisplayReadyFieldRaw, dbName: DBName, metadata: DBColumnMetadata) {
        return new DisplayReadyField(d, dbName, metadata);
    }

    hasValue(): boolean {
        return !!(this.d.value || this.d.displayValOverride);
    }

    getDisplayValue(): string {
        return this.d.displayValOverride ?? this.d.value;
    }

    getOriginalValue(): string {
        return this.d.value;
    }

    getColumnName(): DBColName {
        return this.d.colName;
    }

    wasMatched(): boolean {
        return this.d.matched;
    }

    getDataType(): DBColType {
        return this.metadata.getDataType();
    }

    getDBName(): DBName {
        return this.dbName;
    }
}

// NOTE: this class is passed from workers back to the main thread, hence interface instead of class.
export interface SearchResultEntryRaw {
    readonly key: string;
    readonly rowID: RowIdentifier;
    readonly dbName: DBName;
    readonly dbFullName: DBFullName;
    readonly dbSearchRanking: DBSearchRanking;
    readonly fields: DisplayReadyFieldRaw[];
}

export class SearchResultEntry {
    private constructor(
        private e: SearchResultEntryRaw,
        private fields: DisplayReadyField[],
    ) {
        this.getDisplayKey = this.getDisplayKey.bind(this);
        this.getFieldByNameDEPRECATED = this.getFieldByNameDEPRECATED.bind(this);

        this.getDBName = this.getDBName.bind(this);
        this.getRowID = this.getRowID.bind(this);
        this.getDBFullName = this.getDBFullName.bind(this);
        this.getRanking = this.getRanking.bind(this);
        this.getFields = this.getFields.bind(this);

    }

    static from(entryRaw: SearchResultEntryRaw, fieldHandler: FieldClassificationHandler) {
        const fields = entryRaw.fields.map((fieldRaw) => {
            const dbFullName = entryRaw.dbFullName;
            const colName = fieldRaw.colName;
            const metadata = fieldHandler.getColumnMetadata(dbFullName, colName)
            return DisplayReadyField.from(fieldRaw, dbFullName, metadata);
        });
        return new SearchResultEntry(entryRaw, fields);
    }

    // NOTE: if duplicate fields were added, this would only return the first.
    getFieldByNameDEPRECATED(name: string): DisplayReadyField | null {
        const foundField = this.getFields().find((f) => f.getColumnName() === name);
        return foundField ?? null;
    }

    // TODO: calculate here?
    getDisplayKey(): string {
        return this.e.key;
    }

    getDBName(): DBName {
        return this.e.dbName;
    }
    getRowID(): RowIdentifier {
        return this.e.rowID;
    }

    getDBFullName(): DBFullName {
        return this.e.dbFullName;
    }

    getRanking(): DBSearchRanking {
        return this.e.dbSearchRanking;
    }

    getFields(): DisplayReadyField[] {
        return this.fields;
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
