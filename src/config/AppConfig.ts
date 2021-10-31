// TODO: move a lot of the glue code into separate modules, and have this be more the top-level type definitions (or move this to an AppConfig module)

import {ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import PageHandler from "../pages/PageHandler";
import {DBConfig, DBIdentifier} from "../types/config";
import {getRecordEntries, getRecordValues} from "../utils";

export default class AppConfig {
    private constructor(
        //private appIdentifier: string,
        //private displayName: string,
        //private interfaceLangs: string[],
        //rawAllDBConfigs: RawAllDBConfig,
        private dbConfigs: Map<DBIdentifier, DBConfig>,
        public pageHandler: PageHandler,
        //private langConfigs: RawLangConfig[],
    ) {
    }

    // TODO: unit test this transition
    static from(
        finalConfig: ReturnedFinalConfig,
        appName: string,
    ) {
        const rawAppConfig = finalConfig.apps[appName]!;

        // XXX TODO: better error handling if app doesn't exist
        // NOTE: we explicitly assume that DBs are per-app only.
        const dbIDsToDBConfigs = new Map();
        const allConfigs = rawAppConfig.configs;
        for (const config of getRecordValues(allConfigs)) {
            if (config.configType === "db_config") {
                for (const [dbIdentifier, rawDBConfig] of getRecordEntries(config.config.dbs)) {
                    dbIDsToDBConfigs.set(dbIdentifier, new DBConfig(dbIdentifier, rawDBConfig));
                }
            }
        }

        const pageHandler = PageHandler.fromFinalConfig(finalConfig, appName);

        return new AppConfig(dbIDsToDBConfigs, pageHandler);
    }

    getAllEnabledDBConfigs(ignoreEnabledTag?: boolean): DBConfig[] {
        return Array.from(this.dbConfigs.values())
            .filter((dbConfig) =>
                dbConfig.isEnabled() ||
                ignoreEnabledTag
            );
    }

    getDBConfig(dbIdentifier: DBIdentifier): DBConfig | null {
        return this.dbConfigs.get(dbIdentifier) ?? null;
    }

}
