import {genLoadFinalConfigWILLTHROW} from "../../scripts/compileYamlLib";
import OptionsChangeableByUser from "../ChhaTaigiOptions";
import AppConfig from "./AppConfig";
import {AppID} from "./zodConfigTypes";

test('load basic AppConfig', async () => {
    const appID = "test/simpletest";
    const appIDsOverride: [AppID, ...AppID[]] = [appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});
    const options = new OptionsChangeableByUser();

    const ac = AppConfig.from(rfc, {...options, appID});
    const dbcs = ac.dbConfigHandler.getAllEnabledDBConfigs();

    // simpletest-specific values:
    expect(dbcs.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
});

test('load basic AppConfig with subapps', async () => {
    const options = new OptionsChangeableByUser();

    const appID = "test/simpletest_with_subapps";
    const appIDsOverride: [AppID, ...AppID[]] = [appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});
    const defaultSubApp = rfc.appConfigs[appID]?.configs.appConfig.config.defaultSubApp;
    expect(defaultSubApp).toBeDefined();

    const ac_no_override = AppConfig.from(rfc, {...options, appID});
    const dbcs = ac_no_override.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
    expect(ac_no_override.subAppID).toBeDefined();
    expect(ac_no_override.subAppID).toEqual(defaultSubApp);

    const ac_with_real_override = AppConfig.from(rfc, {...options, appID, subAppID: "happydb"});
    const dbcs_with_override = ac_with_real_override.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs_with_override.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
    expect(ac_with_real_override.subAppID).toBeDefined();
    expect(ac_with_real_override.subAppID).toEqual("happydb");

    const ac_with_bad_override = AppConfig.from(rfc, {...options, appID, subAppID: "FAKE_UGH_xXx@@@BLAH"});
    const dbcs_with_bad_override = ac_with_bad_override.dbConfigHandler.getAllEnabledDBConfigs();
    expect(dbcs_with_bad_override.find((dbc) => dbc.getDBIdentifier() === "happy")).toBeDefined();
    expect(ac_with_bad_override.subAppID).toBeDefined();
    expect(ac_with_bad_override.subAppID).toEqual(defaultSubApp);
});

test('load multiple apps via AppConfig', async () => {
    const options = new OptionsChangeableByUser();

    const app1 = "test/simpletest";
    const app2 = "test/simpletest_with_subapps";
    const appIDsOverride: [AppID, ...AppID[]] = [app1, app2];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});

    const ac1 = AppConfig.from(rfc, {...options, appID: app1});
    expect(ac1.appID).toBe(app1);
    const ac2 = AppConfig.from(rfc, {...options, appID: app2});
    expect(ac2.appID).toBe(app2);
});

test('load basic AppConfig with subapps and views', async () => {
    const options = new OptionsChangeableByUser();

    const appID = "test/simpletest_with_subapps_and_views";
    const appIDsOverride: [AppID, ...AppID[]] = [appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride});
    const defaultSubApp = rfc.appConfigs[appID]?.configs.appConfig.config.defaultSubApp;
    expect(defaultSubApp).toBeDefined();

    {
        const ac = AppConfig.from(rfc, {...options, appID, subAppID: "dbs_mixed_with_null"});
        const viewAngry = ac.dbConfigHandler.getViewForDB("angry");
        expect(viewAngry).toBe("yell_only");
        const viewHappy = ac.dbConfigHandler.getViewForDB("happy");
        expect(viewHappy).toBeNull();
    }

    {
        const ac = AppConfig.from(rfc, {...options, appID, subAppID: "dbs_mixed_with_string"});
        const viewAngry = ac.dbConfigHandler.getViewForDB("angry");
        expect(viewAngry).toBe("yell_only");
        const viewHappy = ac.dbConfigHandler.getViewForDB("happy");
        expect(viewHappy).toBeUndefined();
    }

    {
        const ac = AppConfig.from(rfc, {...options, appID, subAppID: "angrydb"});
        const viewAngry = ac.dbConfigHandler.getViewForDB("angry");
        expect(viewAngry).toBe("person_target");
        const viewHappy = ac.dbConfigHandler.getViewForDB("happy");
        expect(viewHappy).toBeUndefined();
    }
});
// TODO: find out what's causing "Views are defined for db ..."

// TODO: should AppConfig expose a way to change subapps? or should it always just be App + SubApp, and changes should be handled upstream? should there be a callback function on appconfig that notifies the main element when app or subapp has changed?
