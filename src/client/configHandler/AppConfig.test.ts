import {genLoadFinalConfigWILLTHROW} from "../../scripts/compileYamlLib";
import AppConfig from "./AppConfig";
import {AppID} from "./zodConfigTypes";

test('load basic AppConfig', async () => {
    const appID = "test/simpletest";
    const appIDsOverride: [AppID, ...AppID[]] = [appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});

    const ac = AppConfig.from(rfc, appID, null);
    const dbcs = ac.dbConfigHandler.getAllEnabledDBConfigs();

    // simpletest-specific values:
    expect(dbcs.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
});

test('load basic AppConfig with subapps', async () => {
    const appID = "test/simpletest_with_subapps";
    const appIDsOverride: [AppID, ...AppID[]] = [appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});
    const defaultSubApp = rfc.appConfigs[appID]?.configs.appConfig.config.defaultSubApp;
    expect(defaultSubApp).toBeDefined();

    const ac_no_override = AppConfig.from(rfc, appID, null);
    const dbcs = ac_no_override.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
    expect(ac_no_override.subAppID).toBeDefined();
    expect(ac_no_override.subAppID).toEqual(defaultSubApp);

    const ac_with_real_override = AppConfig.from(rfc, appID, "happydb");
    const dbcs_with_override = ac_with_real_override.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs_with_override.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
    expect(ac_with_real_override.subAppID).toBeDefined();
    expect(ac_with_real_override.subAppID).toEqual("happydb");

    const ac_with_bad_override = AppConfig.from(rfc, appID, "FAKE_UGH_xXx@@@BLAH");
    const dbcs_with_bad_override = ac_with_bad_override.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs_with_bad_override.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
    expect(ac_with_bad_override.subAppID).toBeDefined();
    expect(ac_with_bad_override.subAppID).toEqual(defaultSubApp);
});

test('load multiple apps via AppConfig', async () => {
    const app1 = "test/simpletest";
    const app2 = "test/simpletest_with_subapps";
    const appIDsOverride: [AppID, ...AppID[]] = [app1, app2];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});

    const ac1 = AppConfig.from(rfc, app1, null);
    expect(ac1.appID).toBe(app1);
    const ac2 = AppConfig.from(rfc, app2, null);
    expect(ac2.appID).toBe(app2);
});


// TODO: should AppConfig expose a way to change subapps? or should it always just be App + SubApp, and changes should be handled upstream? should there be a callback function on appconfig that notifies the main element when app or subapp has changed?
