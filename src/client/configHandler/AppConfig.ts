// TODO: move a lot of the glue code into separate modules, and have this be more the top-level type definitions (or move this to an AppConfig module)

import type {RawDBList, RawEnabledDBs, ReturnedFinalConfig, SubAppID, RawDBConfigMapping, AppID, ViewID, RawSubAppConfig, AppIDListOrAll} from "../configHandler/zodConfigTypes";
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
                subAppID = defaultSubApp;
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
}

class DBConfigHandler {
    private dbIDsToDBConfigs: Map<DBIdentifier, DBConfig>;

    private dbList: RawDBList;
    private enabledDBs: RawEnabledDBs;

    constructor(
        args: {
            dbList: RawDBList,
            enabledDBs: RawEnabledDBs,
            dbConfigs: RawDBConfigMapping,
        },
        private subAppID: SubAppID | undefined,
    ) {
        this.getViewForDB = this.getViewForDB.bind(this);

        const {dbList, dbConfigs, enabledDBs} = args;
        this.dbList = dbList;
        this.enabledDBs = enabledDBs;

        this.dbIDsToDBConfigs = new Map(
            getRecordEntries(dbConfigs)
                .map(([dbID, rawConfig]) => {
                    const viewID = getViewID(subAppID, dbID, enabledDBs);
                    return ([dbID, new DBConfig(dbID, rawConfig, viewID)]);

                }));

    }

    getViewForDB(dbID: DBIdentifier): ViewID | null | undefined {
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
                    return edbs.map((dbNameOrDBToView) => {
                        if (typeof dbNameOrDBToView === "string") {
                            return dbNameOrDBToView;
                        } else {
                            return Object.keys(dbNameOrDBToView)[0];
                        }
                    });
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
function getViewID(
    subAppID: SubAppID | undefined,
    dbID: DBIdentifier,
    enabledDBs: RawEnabledDBs,
): ViewID | null | undefined {
    if (!Array.isArray(enabledDBs) && subAppID !== undefined) {
        const edbsForSubApp = enabledDBs[subAppID];
        if (edbsForSubApp === undefined) {
            throw new Error(`View for subApp "${subAppID}" not found in "${Object.keys(enabledDBs)}".`);
        } else {
            // Since enabledDBs is a list of either db ids or a mapping of db id to view, we need this odd formulation.
            // Error checking is blessedly sparse here, since we can trust zod to ensure that view ids and etc are valid.
            for (const dbAsStringOrNameToView of edbsForSubApp) {
                let curDB: string;
                if (typeof dbAsStringOrNameToView === "string") {
                    curDB = dbAsStringOrNameToView;
                } else {
                    curDB = Object.keys(dbAsStringOrNameToView)[0];
                    if (curDB === dbID) {
                        const viewID = dbAsStringOrNameToView[curDB];
                        return viewID;
                    }
                }
            }
        }
    }
    return undefined;
}

// TODO: make an rfc wrapper? make existing uses "rrfc" for raw?
// TODO: unit test, cleanup "all" handling
function getAppsOrAll(rfc: ReturnedFinalConfig): AppIDListOrAll {
    const {appIDsOverride} = rfc.overrides ?? {};
    if (appIDsOverride !== undefined && appIDsOverride !== "all") {
        return appIDsOverride;
    }

    if (rfc.buildConfig?.apps !== undefined) {
        return rfc.buildConfig.apps
    }

    return rfc.default.build.config.apps;
}

// TODO: XXX: remove ["all"] from everywhere that the env var sends it, just have a separate env var for "build everything"
// TODO: XXX: unit test
function getInitialApp(rfc: ReturnedFinalConfig): AppID {
    const apps = getAppsOrAll(rfc);

    const {initialAppOverride} = rfc.overrides ?? {};
    const {initialApp} = rfc.buildConfig ?? {};
    if (initialAppOverride !== undefined) {
        if (apps.includes(initialAppOverride)) {
            return initialAppOverride;
        } else {
            console.warn(`Initial app override "${initialAppOverride}" not found, falling back...`);
        }
    }
    if (initialApp !== undefined) {
        if (apps.includes(initialApp)) {
            return initialApp;
        } else {
            console.warn(`Initial app "${initialApp}" not found, falling back...`);
        }
    }

    if (apps === "all") {
        return rfc.default.build.config.initialApp;
    } else {
        return apps[0];
    }
}
