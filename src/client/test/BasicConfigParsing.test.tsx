import * as React from 'react';
noop(React.version);

import {RawEnabledDBs, RawEnabledDBsBySubApp, ReturnedFinalConfig, SubAppsMapping} from '../configHandler/zodConfigTypes';
import {loadFinalConfigForApps} from '../../scripts/compileYamlLib';
import {getRecordEntries, noop} from '../utils';

async function genFinalConfigFromYaml(appIDs: string[]): Promise<ReturnedFinalConfig> {
    // NOTE: This loads configs straight from yaml.
    const rfc = await loadFinalConfigForApps(appIDs);
    // Always sanity check that we're actually loading something:
    expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    return rfc;
}

test('validate test config', async () => {
    const appID = "test/simpletest";
    const rfc = await genFinalConfigFromYaml([appID]);

    expect(rfc.apps[appID]!.configs.appConfig.config.displayName).toBe("Simple Test App");
    expect(rfc.apps[appID]!.configs.appConfig.config.defaultSubApp).toBeUndefined();
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList).toContain("angry");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList).toContain("happy");
    expect(Array.isArray(rfc.apps[appID]!.configs.dbConfig.config.enabledDBs)).toBe(true);
    expect(rfc.apps[appID]!.configs.dbConfig.config.enabledDBs).toEqual(rfc.apps[appID]!.configs.dbConfig.config.dbList);
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.angry!.displayName.eng_us).toBe("Angry!");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.angry!.primaryKey).toBe("id");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.happy!.loadInfo.localCSV).toBe("/db/test/happy.csv");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.happy!.fields.slogan!.type!.dictionary).toBe("definition");
});

test('validate test config with subapps', async () => {
    const appID = "test/simpletest_with_subapps";
    const rfc = await genFinalConfigFromYaml([appID]);
    expect(rfc.apps[appID]!.configs.appConfig.config.displayName).toBe("Simple Test App (With SubApps)");
    expect(rfc.apps[appID]!.configs.appConfig.config.defaultSubApp).toBe("allDBs");
    // TODO: does this work?

    const expectedSubApps: SubAppsMapping = {
        allDBs: {
            displayName: "All DBs"
        },
        happydb: {
            displayName: "Happy DB"
        },
        angrydb: {
            displayName: "Angry DB"
        },
    };

    getRecordEntries(expectedSubApps).forEach(([subAppName, info]) => {
        expect(rfc.apps[appID]!.configs.appConfig.config.subApps).toHaveProperty(subAppName);
        expect(rfc.apps[appID]!.configs.appConfig.config.subApps![subAppName]!.displayName).toBeTruthy();
        expect(rfc.apps[appID]!.configs.appConfig.config.subApps![subAppName]!.displayName).toBe(info.displayName);
    });

    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList).toContain("angry");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList).toContain("happy");
    expect(Array.isArray(rfc.apps[appID]!.configs.dbConfig.config.enabledDBs)).toBe(false);

    const expectedEnabledDBs: RawEnabledDBs = {
        allDBs: ["angry", "happy"],
        happydb: ["happy"],
        angrydb: ["angry"],
    };

    getRecordEntries(expectedEnabledDBs).forEach(([subAppName, enabledDBsForSubApp]) => {
        expect(rfc.apps[appID]!.configs.dbConfig.config.enabledDBs).toHaveProperty(subAppName);
        expect((rfc.apps[appID]!.configs.dbConfig.config.enabledDBs as RawEnabledDBsBySubApp)[subAppName]).toEqual(enabledDBsForSubApp);
    });
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList).toContain("angry");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList).toContain("happy");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbList.length).toBe(2);
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.angry!.displayName.eng_us).toBe("Angry!");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.angry!.primaryKey).toBe("id");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.happy!.loadInfo.localCSV).toBe("/db/test/happy.csv");
    expect(rfc.apps[appID]!.configs.dbConfig.config.dbConfigs.happy!.fields.slogan!.type!.dictionary).toBe("definition");
});

// TODO: either allow for certain broken configs to exist, or manually construct broken app configs in JSON
// TODO: unit test views
