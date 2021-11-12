import {RawAllowedFieldClassifierTags, RawDBConfig} from "../configHandler/zodConfigTypes";
import {CHHA_ALLDB} from "../constants";

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

    // Note:
    // * the REACT_APP_CHHA_ALLDB env var can be used to force-enable all DBs for this app.
    // * if the "disabled" flag isn't present for a db, it defaults to enabled.
    isEnabled(): boolean {
        const isDisabled = this.r.disabled ?? false;
        return !isDisabled || CHHA_ALLDB;
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
