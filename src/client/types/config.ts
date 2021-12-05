import {FieldID, RawAllowedFieldClassifierTags, RawDBConfig, ViewID} from "../configHandler/zodConfigTypes";

export interface DBLoadInfo {
    localCSV?: string;
    localLunr?: string;
}

export type DBIdentifier = string;

export class DBConfig {
    constructor(
        private dbIdentifier: DBIdentifier,
        private r: RawDBConfig,
        private view?: ViewID | null,
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

    getSearchableFields(): FieldID[] {
        if (Array.isArray(this.r.searchableFields)) {
            return this.r.searchableFields;
        } else {
            // TODO: decide what to do if this.view somehow is null. Just throw? zod should guarantee that view is always defined
            //       when searchablefields is a dict
            return this.r.searchableFields[this.view!]!;
        }
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
