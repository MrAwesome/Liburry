import {RawAllDBConfig, RawAllowedFieldClassifierTags, RawDBConfig, RawKnownDisplayTypeEntry} from "../configHandler/zodConfigTypes";
import {CHHA_ALLDB} from "../constants";
import Dialect, {DialectID} from "../languages/dialect";
import {DBColName} from "./dbTypes";

export class AppConfig {
    private constructor(
        //private appIdentifier: string,
        //private displayName: string,
        //private interfaceLangs: string[],
        //rawDBConfigs: RawAllDBConfig,
        private dbConfigs: Map<DBIdentifier, DBConfig>,
        //private langConfigs: RawLangConfig[],
    ) {
    }

    static from(
        rawDBConfigs: RawAllDBConfig,
    ) {
        const dbIdentifierToConfigPairs: [DBIdentifier, DBConfig][] =
            Object.getOwnPropertyNames(rawDBConfigs)
                .map((dbIdentifier) => [dbIdentifier, new DBConfig(dbIdentifier, rawDBConfigs[dbIdentifier])]);
        const dbConfigs = new Map(dbIdentifierToConfigPairs);
        return new AppConfig(dbConfigs);
    }

    getAllEnabledDBConfigs(ignoreEnabledTag?: boolean): DBConfig[] {
        return Array.from(this.dbConfigs.values())
            .filter((dbConfig) =>
                dbConfig.isEnabled() ||
                ignoreEnabledTag ||
                CHHA_ALLDB
            );
    }

    getDBConfig(dbIdentifier: DBIdentifier): DBConfig | null{
        return this.dbConfigs.get(dbIdentifier) ?? null;
    }
}

export interface DBLoadInfo {
    localCSV?: string;
    localLunr?: string;
}

type FieldName = string;

export type DBIdentifier = string;

// TODO: Should these be functions? (yes.)
export class DBConfig {
    private loadInfo: DBLoadInfo;
    private fieldConfigs: FieldConfig[];
    private primaryKey: string;
    private otherMetadata?: {
        [s: string]: any,
    }

    constructor(
        private dbIdentifier: DBIdentifier,
        private r: RawDBConfig,
    ) {
        this.loadInfo = r.loadInfo;
        this.primaryKey = r.primaryKey;

        this.fieldConfigs = Object.getOwnPropertyNames(r.fields).map((rawFieldName) => {
            const rawField = r.fields[rawFieldName];
            let rawDialect = rawField.dialect;
            let dialect: Dialect | Dialect[] | undefined = undefined;

            if (rawDialect !== undefined) {
                if ((rawDialect as string[]).flatMap !== undefined) {
                    dialect = (rawDialect as string[]).map((dialectName) => {
                        // TODO: search langConfig and find dialect config to get info here (or create all Dialects there, then just point to the right dialect here)
                        return new Dialect(dialectName, dialectName);
                    })
                } else {
                    const dialectName = rawDialect as string;
                    dialect = new Dialect(dialectName, dialectName);
                }
            }

            return {
                name: rawFieldName,
                fieldType: rawField.type,
                delimiter: rawField.delimiter,
                delimiterRegex: rawField.delimiterRegex,
                dialect,
            }
        });
    }

    asRaw(): RawDBConfig {
        return this.r;
    }

    isEnabled(): boolean {
        return this.r.enabled ?? false;
    }

    getDBLoadInfo() {
        return this.loadInfo;
    }

    getPrimaryKey() {
        return this.primaryKey;
    }

    getDisplayName(lang: DialectID) {
        // THROW: not defined yet
        throw new Error("Not implemented yet.");
    }

    getDBIdentifier() {
        return this.dbIdentifier;
    }

    // TODO: return a less-raw view into column metadata
    getColumnMetadata(colName: DBColName): RawAllowedFieldClassifierTags {
        return this.r.fields[colName];
    }

    //
    // TODO: dynamically determine these by checking isTitleType (for now just "vocab") on all fields then getting the lang of those fields
    //titleLangs: Language[],
    //dataLangs: Language[],

}

export interface FieldConfig {
    name: FieldName,
    fieldType: RawKnownDisplayTypeEntry | undefined,
    delimiter?: string,
    delimiterRegex?: string,

    // NOTE: The array is so that fields containing multiple languages can be appropriately tagged
    dialect: Dialect | Dialect[] | undefined,
}

