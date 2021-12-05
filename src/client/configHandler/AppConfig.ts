// TODO: move a lot of the glue code into separate modules, and have this be more the top-level type definitions (or move this to an AppConfig module)

import {RawDBList, RawEnabledDBs, ReturnedFinalConfig, SubAppID, RawDBConfigMapping, AppID, ViewID, RawSubAppConfig} from "../configHandler/zodConfigTypes";
import PageHandler from "../pages/PageHandler";
import {DBConfig, DBIdentifier} from "../types/config";
import {getRecordEntries, nullGuard} from "../utils";

export default class AppConfig {
    private constructor(
        //private appIdentifier: string,
        //private displayName: string,
        //private interfaceLangs: string[],
        //rawAllDBConfigs: RawAllDBConfig,
        private rfc: ReturnedFinalConfig,
        public pageHandler: PageHandler,
        public dbConfigHandler: DBConfigHandler,
        //private langConfigs: RawLangConfig[],
        public appID: AppID,
        public subAppID?: SubAppID,
    ) {
        this.getRawAppConfig = this.getRawAppConfig.bind(this);
        this.getRawSubAppConfig = this.getRawSubAppConfig.bind(this);
        this.getDialectBlacklistRegex = this.getDialectBlacklistRegex.bind(this);
    }

    // TODO: unit test this transition
    static from(
        rfc: ReturnedFinalConfig,
        appID: AppID,
        subAppIDOverride?: SubAppID,
    ) {
        // TODO: possibly throw a more useful error message here? Can this ever really happen?

        const pageHandler = PageHandler.fromFinalConfig(rfc, appID);
        const rawAppConfig = rfc.apps[appID]!;
        const allConfigs = rawAppConfig.configs;
        const subAppID = subAppIDOverride ?? rawAppConfig.configs.appConfig.config.defaultSubApp;
        const dbConfigHandler = new DBConfigHandler(allConfigs.dbConfig.config, subAppID);
        return new AppConfig(rfc, pageHandler, dbConfigHandler, appID, subAppID);
    }

    private getRawAppConfig() {
        return this.rfc.apps[this.appID]!;
    }

    private getRawSubAppConfig(): RawSubAppConfig | undefined {
        if (this.subAppID !== undefined) {
            return this.getRawAppConfig().configs.appConfig.config.subApps?.[this.subAppID];
        }
        return undefined;
    }

    // TODO: decide if RFC should return created objects (and compileyaml should write the raw version out after just verifying)
    //       if so, make regex fields there be refined into actual regex on parse (and/or just parse directly into an AppConfig, etc)
    getDialectBlacklistRegex(): RegExp | undefined {
        const reggie = this.getRawSubAppConfig()?.blacklistDialectsRegex;
        if (reggie !== undefined) {
            return new RegExp(reggie, "g");
        }
        return undefined;
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

    getViewID(dbID: DBIdentifier): ViewID | null | undefined {
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

    getAllEnabledDBConfigs(): DBConfig[] {
        // NOTE: the bypass here is for testing, and will certainly disappear.
        return nullGuard(this.getAllEnabledDBs()
            .map((dbID) => this.dbIDsToDBConfigs.get(dbID)));
    }
}

// TODO: handle alldb overrides here, or always just use subapp instead
function getViewID(subAppID: SubAppID | undefined, dbID: DBIdentifier, enabledDBs: RawEnabledDBs): ViewID | null | undefined {
    if (!Array.isArray(enabledDBs) && subAppID !== undefined) {
        const edbsForSubApp = enabledDBs[subAppID];
        if (!Array.isArray(edbsForSubApp)) {
            // if it's null, that means the db doesn't have a view so use searchablefields directly
            return edbsForSubApp?.[dbID];
        }
    }
    return undefined;
}
