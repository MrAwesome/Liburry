import * as React from 'react';
noop(React.version);

import {liburryCustomErrorCodes, LiburryTokenTypes, LiburryZodCustomTestingCode, RawEnabledDBs, RawEnabledDBsBySubApp, ReturnedFinalConfig, SubAppsMapping, tokenMatchers} from '../configHandler/zodConfigTypes';
import {loadFinalConfigForApps, loadFinalConfigForAppsSafe} from '../../scripts/compileYamlLib';
import {getRecordEntries, noop} from '../utils';
import {z} from 'zod';

async function genFinalConfigFromYaml(appIDs: string[]): Promise<ReturnedFinalConfig> {
    // NOTE: This loads configs straight from yaml.
    const rfc = await loadFinalConfigForApps(appIDs);
    // Always sanity check that we're actually loading something:
    expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    return rfc;
}

// TODO: test taigi.us and other major configs here too? ensure all prod configs pass as a test?
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

// TODO: add more checks here, or just trust zod?
test('validate test config with subapps and views', async () => {
    const appID = "test/simpletest_with_subapps_and_views";
    const rfc = await genFinalConfigFromYaml([appID]);
    expect(rfc.apps[appID]!.configs.appConfig.config.displayName).toBe("Simple Test App (With SubApps And Views)");
    expect(rfc.apps[appID]!.configs.appConfig.config.defaultSubApp).toBe("dbs_mixed");
});

test('ensure broken config fails zod', async () => {
    const appID = "test/simpletest_breakages亞歷山大";
    const sprt = await loadFinalConfigForAppsSafe([appID]);

    const tokenMatchRegex = /^\[([A-Z_]+)\]/;

    const expectedErrorCodes: Set<LiburryZodCustomTestingCode> = new Set(liburryCustomErrorCodes);

    // NOTE: another test / set of tests can check these in the future
    const exemptedErrorCodes: LiburryZodCustomTestingCode[] = [
        "enableddbs_dict_has_no_subapps", // we want to test subapp validity
        "edbs_is_list_but_views_defined_list", // it's a dict, not array
        "enabled_dbname_not_valid_array", // we're using a dict, not array
        "remote_files_https", // not enabled yet
        "defaultsubapp_subapps_both_or_neither", // want to define subapps to check they're wrong
    ];

    exemptedErrorCodes.forEach((code) => expect(expectedErrorCodes.delete(code)).toBe(true));

    // Expect to encounter one of each type of token error in our example file.
    // NOTE: you can also test zod basic errors, to ensure e.g. string length, important fields are defined
    const expectedInvalidTokens: Set<LiburryTokenTypes> = new Set(
        (Object.keys(tokenMatchers) as (keyof typeof tokenMatchers)[]).filter((key) => (tokenMatchers[key] !== null))
    );


    if (sprt.success === true) {
        console.log(sprt.data);
        throw new Error("Broken config did not fail parsing!");
    } else {
        const encounteredErrorCodes: Set<LiburryZodCustomTestingCode> = new Set();
        const encounteredTokenErrors: Set<LiburryTokenTypes> = new Set();
        const otherEncounteredIssues: Set<z.ZodIssue> = new Set();

        sprt.error.issues.forEach((issue) => {
            if ("_liburryCode" in issue) {
                encounteredErrorCodes.add(issue["_liburryCode"]);
                // NOTE: this will break on future regex checks, but unfortunately there's no way to pass data back to our code from regex, so we need to check the error codes here
            } else if (
                issue.code === "invalid_string" &&
                issue.validation === "regex" &&
                tokenMatchRegex.test(issue.message)
            ) {
                const tokenErrType = tokenMatchRegex.exec(issue.message)?.[1]!;
                if (tokenErrType in tokenMatchers) {
                    encounteredTokenErrors.add(tokenErrType as LiburryTokenTypes);
                }

            } else {
                otherEncounteredIssues.add(issue);
            }


        })

        expect(Array.from(otherEncounteredIssues)).toEqual([]);

        expectedErrorCodes.forEach((err) => {
            expect(encounteredErrorCodes).toContain(err);
        });

        encounteredErrorCodes.forEach((err) => {
            expect(expectedErrorCodes).toContain(err);
        });

        expectedInvalidTokens.forEach((tok) => {
            expect(encounteredTokenErrors).toContain(tok);
        });

        encounteredTokenErrors.forEach((tok) => {
            expect(expectedInvalidTokens).toContain(tok);
        });
    }
});