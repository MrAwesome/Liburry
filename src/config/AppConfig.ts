// TODO: move a lot of the glue code into separate modules, and have this be more the top-level type definitions (or move this to an AppConfig module)

import {RawDBList, RawEnabledDBs, ReturnedFinalConfig, SubAppID, RawDBConfigMapping, AppID, ViewID} from "../configHandler/zodConfigTypes";
import PageHandler from "../pages/PageHandler";
import {DBConfig, DBIdentifier} from "../types/config";
import {getRecordEntries, nullGuard} from "../utils";

export default class AppConfig {
    private constructor(
        //private appIdentifier: string,
        //private displayName: string,
        //private interfaceLangs: string[],
        //rawAllDBConfigs: RawAllDBConfig,
        public pageHandler: PageHandler,
        public dbConfigHandler: DBConfigHandler,
        //private langConfigs: RawLangConfig[],
        public subAppID?: SubAppID,
    ) {
    }

    // TODO: unit test this transition
    static from(
        finalConfig: ReturnedFinalConfig,
        appID: AppID,
        subAppID?: SubAppID,
    ) {
        // TODO: possibly throw a more useful error message here? Can this ever really happen?

        const pageHandler = PageHandler.fromFinalConfig(finalConfig, appID);
        const rawAppConfig = finalConfig.apps[appID]!;
        const allConfigs = rawAppConfig.configs;
        const dbConfigHandler = new DBConfigHandler(allConfigs.dbConfig.config, subAppID);
        return new AppConfig(pageHandler, dbConfigHandler, subAppID);
    }
}

class DBConfigHandler {
//    private bySubApp?: Map<string, Set<string>>;
//    private byGlobalList?: Set<string>;
    private dbIDsToDBConfigs: Map<DBIdentifier, DBConfig>;

    private dbList: RawDBList;
    private enabledDBs: RawEnabledDBs;

    constructor(
        args: {
            dbList: RawDBList,
            enabledDBs: RawEnabledDBs,
            dbConfigs: RawDBConfigMapping,
        },
        private subAppID?: SubAppID,
    ) {
        this.getViewID = this.getViewID.bind(this);

        const {dbList, dbConfigs, enabledDBs} = args;
        this.dbList = dbList;
        this.enabledDBs = enabledDBs;


//        if (enabledDBsBySubApp !== undefined) {
//            this.bySubApp = new Map(getRecordEntries(enabledDBsBySubApp).map(([aid, dbs]) => ([aid, new Set(dbs)])));
//        }
//
//        if (enabledDBs !== undefined) {
//            this.byGlobalList = new Set(enabledDBs);
//        }

        // EnabledDBs doesn't have views associated with it

        //  TODO: look for viewids here, and pass them in based on the current subapp
        this.dbIDsToDBConfigs = new Map(
            getRecordEntries(dbConfigs)
            .map(([dbID, rawConfig]) => {
                const viewID = getViewID(subAppID, dbID, enabledDBs);
                return ([dbID, new DBConfig(dbID, rawConfig, viewID)]);

            }));

    }

    getViewID(dbID: DBIdentifier): ViewID | undefined {
        return getViewID(this.subAppID, dbID, this.enabledDBs);
    }

    getConfig(dbIdentifier: DBIdentifier): DBConfig | null {
        return this.dbIDsToDBConfigs.get(dbIdentifier) ?? null;
    }

    getAllDBConfigs(): DBConfig[] {
        return Array.from(this.dbIDsToDBConfigs.values());
    }

    private getAllEnabledDBs(): DBIdentifier[] {
        const {enabledDBs} = this;
        if (!Array.isArray(enabledDBs)) {
            if (this.subAppID !== undefined) {
                const edbs = enabledDBs?.[this.subAppID];
                if (edbs !== undefined) {
                    if (!Array.isArray(edbs)) {
                        return Object.keys(edbs);
                    } else {
                        return edbs;
                    }
                }
            }
        } else {
            return enabledDBs;
        }

        return this.dbList;
    }

    getAllEnabledDBConfigs(ignoreEnabledTag?: boolean): DBConfig[] {
        if (ignoreEnabledTag !== undefined) {
            return this.getAllDBConfigs();
        }
        return nullGuard(this.getAllEnabledDBs()
            .map((dbID) => this.dbIDsToDBConfigs.get(dbID)));
    }
}

function getViewID(subAppID: SubAppID | undefined, dbID: DBIdentifier, enabledDBs: RawEnabledDBs): ViewID | undefined {
    if (!Array.isArray(enabledDBs) && subAppID !== undefined) {
        const edbsForSubApp = enabledDBs[subAppID];
        if (!Array.isArray(edbsForSubApp)) {
            return edbsForSubApp?.[dbID];
        }
    }
    return undefined;
}
