// TODO: move a lot of the glue code into separate modules, and have this be more the top-level type definitions (or move this to an AppConfig module)

import type {RawDBList, RawEnabledDBs, ReturnedFinalConfig, SubAppID, RawDBConfigMapping, AppID, ViewID, RawSubAppConfig, AppIDList} from "../configHandler/zodConfigTypes";
import PageHandler from "../pages/PageHandler";
import {DBConfig, DBIdentifier} from "../types/config";
import {getRecordEntries, getRecordValues, nullGuard, runningInJest} from "../utils";
import {FontConfig} from "./zodFontConfigTypes";

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
        public subAppID: SubAppID | null,
    ) {
        this.getRawAppConfig = this.getRawAppConfig.bind(this);
        this.getRawSubAppConfig = this.getRawSubAppConfig.bind(this);
        this.getDialectBlacklistRegex = this.getDialectBlacklistRegex.bind(this);
    }

    // TODO: unit test this transition
    static from(
        rfc: ReturnedFinalConfig,
        appID: AppID | null,
        subAppIDOverride: SubAppID | null,
    ) {
        if (appID === null) {
            appID = getInitialApp(rfc);
        }

        const pageHandler = PageHandler.fromFinalConfig(rfc, appID);
        const rawAppConfig = rfc.appConfigs[appID]!;
        const allConfigs = rawAppConfig.configs;

        // TODO: unit test this logic
        const {defaultSubApp, subApps} = rawAppConfig.configs.appConfig.config;
        let subAppID = defaultSubApp;
        if (subAppIDOverride !== null && subApps !== undefined) {
            if (subAppIDOverride in subApps) {
                subAppID = subAppIDOverride;
            } else {
                if (!runningInJest()) {
                    const subAppList = Object.keys(subApps).join(", ");
                    console.error(`A subapp override was given ("${subAppIDOverride}"), but it was not found in the subapps for this app: (app: "${appID}", subapps: (${subAppList}))`);
                    console.error(`Using default subapp: "${defaultSubApp}"`);
                }
            }
        }

        const dbConfigHandler = new DBConfigHandler(allConfigs.dbConfig.config, subAppID);
        return new AppConfig(rfc, pageHandler, dbConfigHandler, appID, subAppID ?? null);
    }

    private getRawAppConfig() {
        return this.rfc.appConfigs[this.appID]!;
    }

    private getRawSubAppConfig(): RawSubAppConfig | undefined {
        if (this.subAppID !== null) {
            return this.getRawAppConfig().configs.appConfig.config.subApps?.[this.subAppID];
        }
        return undefined;
    }

    // NOTE: Could get fonts from "default" here, if there's ever a reason for that.
    getAllFontConfigs(): FontConfig[] {
        return getRecordValues(this.rfc.appConfigs)
            .map((app) => app.configs.appConfig.config.fonts)
            .filter(nullGuard).flat();

    }

    // TODO: decide if RFC should return created objects (and compileyaml should write the raw version out after just verifying)
    //       if so, make regex fields there be refined into actual regex on parse (and/or just parse directly into an AppConfig, etc)
    getDialectBlacklistRegex(): string | undefined {
        return this.getRawSubAppConfig()?.blacklistDialectsRegex;
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
        return this.getAllEnabledDBs()
            .map((dbID) => this.dbIDsToDBConfigs.get(dbID))
            .filter(nullGuard);
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

// TODO: make an rfc wrapper? make existing uses "rrfc" for raw?
function getApps(rfc: ReturnedFinalConfig): AppIDList {
    if (rfc.overrides?.appIDsOverride !== undefined) {
        return rfc.overrides?.appIDsOverride;
    }

    if (rfc.buildConfig?.apps !== undefined) {
        return rfc.buildConfig.apps
    }

    return rfc.default.build.config.apps;
}

// TODO: XXX: unit test
function getInitialApp(rfc: ReturnedFinalConfig): AppID {
    if (rfc.overrides?.initialAppOverride !== undefined) {
        return rfc.overrides?.initialAppOverride;
    }
    if (rfc.buildConfig?.initialApp !== undefined) {
        return rfc.buildConfig?.initialApp;
    }

    const apps = getApps(rfc);
    if (apps !== "all") {
        return apps[0];
    }
    return rfc.default.build.config.initialApp;
}
