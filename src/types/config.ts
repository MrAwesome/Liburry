import {RawAllowedFieldClassifierTags, RawDBConfig} from "../configHandler/zodConfigTypes";

export interface DBLoadInfo {
    localCSV?: string;
    localLunr?: string;
}

export type DBIdentifier = string;

// TODO: Should these be functions? (yes.)
export class DBConfig {
    constructor(
        private dbIdentifier: DBIdentifier,
        private r: RawDBConfig,
    ) { }

    asRaw(): RawDBConfig {
        return this.r;
    }

    getDBLoadInfo() {
        return this.r.loadInfo;
    }

    getPrimaryKey() {
        return this.r.primaryKey;
    }

    getSearchableFields() {
        return this.r.searchableFields;
    }

    getDBIdentifier() {
        return this.dbIdentifier;
    }

    // TODO: return a less-raw view into column metadata
    getColumnMetadata(colName: string): RawAllowedFieldClassifierTags {
        // XXX: TODO: better error handling
        return this.r.fields[colName]!;
    }

    //
    // TODO: dynamically determine these by checking isTitleType (for now just "vocab") on all fields then getting the lang of those fields
    //titleLangs: Language[],
    //dataLangs: Language[],

}
