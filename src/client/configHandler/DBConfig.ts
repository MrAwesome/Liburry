import {KnownDialectID} from "../../common/generatedTypes";
import {knownDialectIDsSet} from "../../generated/i18n";
import {FieldID, RawFieldMetadata, RawDBConfig, ViewID, DBIdentifier} from "../configHandler/zodConfigTypes";
import {nullGuard} from "../utils";

export interface DBLoadInfo {
    localCSV?: string;
    localLunr?: string;
}

// A helper class for handling dataset metadata. Should be initialized separately for different views.
export default class DBConfig {
    // Since this is often used for initialization, not checking for presence, it returns an array instead of a set.
    private searchableFieldIDs: [FieldID, ...FieldID[]];
    private displayableFieldIDs: Set<FieldID>;
    private savedSearchableKnownDialects?: KnownDialectID[];

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
            this.displayableFieldIDs = new Set(r.views[view].displayableFields);
            this.searchableFieldIDs = r.views[view].searchableFields;
        } else {
            this.displayableFieldIDs = new Set(r.displayableFields);
            this.searchableFieldIDs = r.searchableFields;
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

    getDisplayableFieldIDs(): Set<FieldID> {
        return this.displayableFieldIDs;
    }

    // Since this is often used for initialization, not checking for presence, it returns an array instead of a set.
    getSearchableFieldIDs(): [FieldID, ...FieldID[]] {
        return this.searchableFieldIDs;
    }

    private getRawDialectIDsForSearchableFields(): string[] {
        return this.getSearchableFieldIDs()
            .map((fieldID) => this.r.fields[fieldID]!.dialect)
            .filter(nullGuard)
            .flat();
    }

    getKnownDialectIDsForSearchableFields(): KnownDialectID[] {
        // Use memoization of the results for this DBConfig instance only
        if (this.savedSearchableKnownDialects !== undefined) {
            return this.savedSearchableKnownDialects;
        }

        const seenRawDialects = this.getRawDialectIDsForSearchableFields();

        // If a dialect has entries in our lang configs, it counts as "known"
        const seenKnownDialects: KnownDialectID[] = []
        seenRawDialects.forEach((rawDialect) => {
            if (knownDialectIDsSet.has(rawDialect as KnownDialectID)) {
                seenKnownDialects.push(rawDialect as KnownDialectID);
            }
        });

        this.savedSearchableKnownDialects = seenKnownDialects;
        return seenKnownDialects;
    }

    getDBIdentifier() {
        return this.dbIdentifier;
    }

    getColumnMetadata(colName: string): RawFieldMetadata {
        // NOTE: this assumes that column names are known/valid
        return this.r.fields[colName]!;
    }

    getDisplayName(dialectID: KnownDialectID): string | undefined {
        return this.r.displayNames[dialectID];
    }

    getSourceURL() {
        return this.r.source;
    }

    getLicenseString() {
        return this.r.license;
    }
}
