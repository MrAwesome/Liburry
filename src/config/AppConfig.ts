// TODO: move a lot of the glue code into separate modules, and have this be more the top-level type definitions (or move this to an AppConfig module)

import {ReturnedFinalConfig, SubAppID} from "../configHandler/zodConfigTypes";
import {CHHA_ALLDB} from "../constants";
import PageHandler from "../pages/PageHandler";
import {DBConfig, DBIdentifier} from "../types/config";
import {getRecordEntries} from "../utils";

export default class AppConfig {
    private constructor(
        //private appIdentifier: string,
        //private displayName: string,
        //private interfaceLangs: string[],
        //rawAllDBConfigs: RawAllDBConfig,
        private dbConfigs: Map<DBIdentifier, DBConfig>,
        public pageHandler: PageHandler,
        private enabledDBs: Map<SubAppID, Set<DBIdentifier>>,
        //private langConfigs: RawLangConfig[],
    ) {
    }

    // TODO: unit test this transition
    static from(
        finalConfig: ReturnedFinalConfig,
        appName: string,
    ) {
        // TODO: possibly throw a more useful error message here? Can this ever really happen?
        const rawAppConfig = finalConfig.apps[appName]!;

        const dbIDsToDBConfigs = new Map();
        const allConfigs = rawAppConfig.configs;
        const {dbConfigs, enabledDBs} = allConfigs.dbConfig.config;
        // TODO: unit test enabledsubapps
        for (const [dbIdentifier, rawDBConfig] of getRecordEntries(dbConfigs)) {
            dbIDsToDBConfigs.set(dbIdentifier, new DBConfig(dbIdentifier, rawDBConfig));
        }


        // XXX TODO: when changing subapp, the main element needs to restart its searchers, or at least handle the delta

        const pageHandler = PageHandler.fromFinalConfig(finalConfig, appName);

        const edbs = new Map(getRecordEntries(enabledDBs).map(([aid, dbs]) => ([aid, new Set(dbs)])));
        return new AppConfig(dbIDsToDBConfigs, pageHandler, edbs);
    }

    getAllEnabledDBConfigs(ignoreEnabledTag?: boolean): DBConfig[] {
        // XXX TODO
        const subAppID = "eng_poj";
        return Array.from(this.dbConfigs.values())
            .filter((dbConfig) =>
                CHHA_ALLDB ||
                ignoreEnabledTag ||
                this.enabledDBs.get(subAppID)?.has(dbConfig.getDBIdentifier())
            );
    }

    getDBConfig(dbIdentifier: DBIdentifier): DBConfig | null {
        return this.dbConfigs.get(dbIdentifier) ?? null;
    }

}
