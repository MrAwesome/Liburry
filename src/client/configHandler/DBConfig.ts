import {FieldID, RawFieldMetadata, RawDBConfig, ViewID, DBIdentifier} from "../configHandler/zodConfigTypes";

export interface DBLoadInfo {
    localCSV?: string;
    localLunr?: string;
}

export default class DBConfig {
    // Since this is often used for initialization, not checking for presence, it returns an array instead of a set.
    private searchableFields: [FieldID, ...FieldID[]];
    private displayableFields: Set<FieldID>;

    constructor(
        private dbIdentifier: DBIdentifier,
        private r: RawDBConfig,
        view?: ViewID | null,
    ) {
        if ("views" in r) {
            const fallbackView = Object.keys(r.views)[0];
            if (view === null || view === undefined) {
                console.error(`Views are defined for db "${dbIdentifier}", but view is "${view}"! Falling back to the first view: ${fallbackView}.`);
                view = fallbackView;
            }
            if (!(view in r.views)) {
                console.error(`View "${view}" is not one of "${r.views}"! Falling back to the first view: ${fallbackView}.`);
                view = fallbackView;
            }
            this.displayableFields = new Set(r.views[view].displayableFields);
            this.searchableFields = r.views[view].searchableFields;
        } else {
            this.displayableFields = new Set(r.displayableFields);
            this.searchableFields = r.searchableFields;
        }
    }

    asRaw(): RawDBConfig {
        return this.r;
    }

    getDBLoadInfo() {
        return this.r.loadInfo;
    }

    getPrimaryKey() {
        return this.r.primaryKey;
    }

    getDisplayableFields(): Set<FieldID> {
        return this.displayableFields;
    }

    // Since this is often used for initialization, not checking for presence, it returns an array instead of a set.
    getSearchableFields(): [FieldID, ...FieldID[]] {
        return this.searchableFields;
    }

    getDBIdentifier() {
        return this.dbIdentifier;
    }

    // TODO: return a less-raw view into column metadata
    getColumnMetadata(colName: string): RawFieldMetadata {
        // XXX: TODO: better error handling
        return this.r.fields[colName]!;
    }

    //
    // TODO: dynamically determine these by checking isTitleType (for now just "vocab") on all fields then getting the lang of those fields
    //titleLangs: Language[],
    //dataLangs: Language[],

}
