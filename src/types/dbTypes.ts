import type {RawAllowedFieldClassifierTags} from "../configHandler/zodConfigTypes";
import type {DialectID} from "../languages/dialect";
import type {DBSearchRanking} from "../search";
import type {AppConfig, DBIdentifier} from "./config";
import type {DataType, DisplayType} from "./displayTypes";

// TODO: move the code here that isn't type-only somewhere else

export type RowIdentifier = number;
export type OldDBShortName = string;
export type DBFullName = string;
export type DBFilename = string;
export type SearchPreppedKey = string;
export type EntryFieldNameToPreppedNameMapping = Map<string, SearchPreppedKey>;

export interface OldLangDB {
    shortName: OldDBShortName,
    fullName: DBFullName,
    upstreamCSV: DBFilename,
    localCSV: DBFilename,
    localCSVVersion: number,
    localLunr: DBFilename,
    localLunrVersion: number,
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
    dbIdentifier: DBIdentifier,
    results: Array<SearchResultEntryRaw>,
}

// NOTE: This type is passed back from web workers.
export interface AnnotatedPerDictResultsRaw {
    dbIdentifier: DBIdentifier,
    results: Array<AnnotatedSearchResultEntryRaw>,
}

export function annotateRawResults(allRes: PerDictResultsRaw, appConfig: AppConfig): AnnotatedPerDictResultsRaw {
    const {dbIdentifier} = allRes;
    const dbConfig = appConfig.getDBConfig(dbIdentifier);
    const results: AnnotatedSearchResultEntryRaw[] = allRes.results.map((entryRaw) => {
        const fields: AnnotatedDisplayReadyFieldRaw[] = entryRaw.fields.map((fieldRaw) => {
            const colName = fieldRaw.colName;
            const metadata = dbConfig?.getColumnMetadata(colName)
            // NOTE: it may be wasteful to pass all of this data onwards, since every field will pass all of the metadata associated with it along with every single entry (so the fieldclassifier approach may save some space)
            return {
                ...fieldRaw,
                metadata,
            };
        });
        return {
            ...entryRaw,
            fields,
        }
    });

    return {
        dbIdentifier,
        results,
    }
}


export class AnnotatedPerDictResults {
    private results: AnnotatedSearchResultEntry[];
    constructor(
        private r: AnnotatedPerDictResultsRaw,
    ) {
        this.results = r.results.map((rawEntry) => new AnnotatedSearchResultEntry(rawEntry));
    }

    getDBIdentifier(): DBIdentifier {
        return this.r.dbIdentifier;
    }

    getResults(): Array<AnnotatedSearchResultEntry> {
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

// TODO: this most likely should be some enum or abstract type
export type DBColType = string;

// NOTE: this class is passed from workers back to the main thread, hence interface instead of class.
export interface DisplayReadyFieldRaw {
    readonly colName: DBColName;
    readonly value: DBColVal;
    readonly matched: boolean;
    readonly displayValOverride?: string;
}

// NOTE: this class is passed from workers back to the main thread, hence interface instead of class.
export interface AnnotatedDisplayReadyFieldRaw extends DisplayReadyFieldRaw {
    metadata?: RawAllowedFieldClassifierTags,
}

export class AnnotatedDisplayReadyField {
    private delimiterRegex?: RegExp;

    constructor(
        private d: AnnotatedDisplayReadyFieldRaw,
        private dbIdentifier: DBIdentifier,
    ){
        this.hasValue = this.hasValue.bind(this);
        this.getDisplayValue = this.getDisplayValue.bind(this);
        this.getColumnName = this.getColumnName.bind(this);

        const reggie = this.d.metadata?.delimiterRegex;
        if (reggie !== undefined) {
            this.delimiterRegex = new RegExp(reggie, "g");
        }
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

    getDataTypeForDisplayType(appDisplayType: DisplayType): DataType | null {
        const dt = this.d.metadata?.type;
        if (dt !== undefined) {
            return dt[appDisplayType] ?? null;
        } else {
            return null
        }
    }

    getDialect(): DialectID | DialectID[] | null {
        return this.d.metadata?.dialect ?? null;
    }

    getDBIdentifier(): DBIdentifier {
        return this.dbIdentifier;
    }

    getDelimiter(): RegExp | string | null {
        return this.delimiterRegex ??
            this.d.metadata?.delimiter ??
            null;
    }
}

// NOTE: this class is passed from workers back to the main thread, hence interface instead of class.
export interface SearchResultEntryRaw {
    readonly key: string;
    readonly rowID: RowIdentifier;
    readonly dbIdentifier: DBIdentifier;
    // NOTE: this should use the language-aware displayName from the DBConfig instead
    readonly dbSearchRanking: DBSearchRanking;
    readonly fields: DisplayReadyFieldRaw[];
}

// NOTE: this class is passed from workers back to the main thread, hence interface instead of class.
export interface AnnotatedSearchResultEntryRaw extends SearchResultEntryRaw {
    readonly fields: AnnotatedDisplayReadyFieldRaw[];
}

export class AnnotatedSearchResultEntry {
    private fields: AnnotatedDisplayReadyField[];

    constructor(
        private e: AnnotatedSearchResultEntryRaw,
    ) {
        this.fields = e.fields.map((fieldRaw) => new AnnotatedDisplayReadyField(fieldRaw, e.dbIdentifier));

        this.getDisplayKey = this.getDisplayKey.bind(this);
        this.getFieldByNameDEPRECATED = this.getFieldByNameDEPRECATED.bind(this);

        this.getDBIdentifier = this.getDBIdentifier.bind(this);
        this.getRowID = this.getRowID.bind(this);
        this.getRanking = this.getRanking.bind(this);
        this.getFields = this.getFields.bind(this);

    }

    // NOTE: if duplicate fields were added, this would only return the first.
    getFieldByNameDEPRECATED(name: string): AnnotatedDisplayReadyField | null {
        const foundField = this.getFields().find((f) => f.getColumnName() === name);
        return foundField ?? null;
    }

    // TODO: calculate here?
    getDisplayKey(): string {
        return this.e.key;
    }

    getDBIdentifier(): DBIdentifier {
        return this.e.dbIdentifier;
    }
    getRowID(): RowIdentifier {
        return this.e.rowID;
    }

    getRanking(): DBSearchRanking {
        return this.e.dbSearchRanking;
    }

    // Note that this only returns fields with valid values
    getFields(): AnnotatedDisplayReadyField[] {
        return this.fields.filter(f => f.hasValue());
    }
}

// TODO: search for \<id\> - instead of hardcoding "id", use dbconfig.dbbbb.primaryKey
export interface RawDBRow {
    [s: string]: string,
}

export function getDBRowKeys(r: RawDBRow): (keyof RawDBRow)[] {
    const fields = Object.getOwnPropertyNames(r);
    return fields;
}
