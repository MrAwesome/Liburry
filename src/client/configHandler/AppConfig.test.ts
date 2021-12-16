import {genFinalConfigFromYaml} from "../test/testUtils";
import AppConfig from "./AppConfig";

test('load basic AppConfig', async () => {
    const appID = "test/simpletest";
    const rfc = await genFinalConfigFromYaml([appID]);

    const ac = AppConfig.from(rfc, appID);
    const dbcs = ac.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
});

test('load basic AppConfig with subapps', async () => {
    const appID = "test/simpletest_with_subapps";
    const rfc = await genFinalConfigFromYaml([appID]);
    const defaultSubApp = rfc.apps[appID]?.configs.appConfig.config.defaultSubApp;
    expect(defaultSubApp).toBeDefined();

    const ac_no_override = AppConfig.from(rfc, appID);
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

// TODO: test multiple apps load
// TODO: test multiples of same app name
// TODO: test non-existent appid on creation (should throw? or default to CHHA_APPNAME in .from?)
// TODO: should AppConfig expose a way to change subapps? or should it always just be App + SubApp, and changes should be handled upstream? should there be a callback function on appconfig that notifies the main element when app or subapp has changed?
