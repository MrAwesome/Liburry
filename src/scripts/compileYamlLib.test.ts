import {AppID, RawBuildConfig, RawDefaultBuildConfig} from "../client/configHandler/zodConfigTypes";
import {genIndexHTMLEnvVarPairs, genLoadFinalConfigWILLTHROW, IndexHtmlEnvVarPairs} from "./compileYamlLib";

test('load only defaults and sanity check', async () => {
    const rfc = await genLoadFinalConfigWILLTHROW();
    expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    expect(rfc.buildConfig).toBe(undefined);
    expect(rfc.default.build.config.indexHtml.themeColor).toBeTruthy();
});

test('load single app and sanity check', async () => {
    const appID = "test/simpletest";
    const appIDs: [AppID, ...AppID[]] = [appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDs});

    expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    expect(rfc.buildConfig).toBe(undefined);
    expect(Object.keys(rfc.appConfigs)).toEqual(appIDs);
    expect(rfc.default.build.config.indexHtml.themeColor).toBeTruthy();

    expect(rfc.appConfigs[appID]?.appID).toBe(appID);
    expect(rfc.appConfigs[appID]?.configs.appConfig.config.displayName).toBe("Simple Test App");
});

test('load multiple apps via override', async () => {
    const appIDs: [AppID, ...AppID[]] = ["test/simpletest", "test/simpletest_with_subapps"];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDs});
    expect(Object.keys(rfc.appConfigs)).toEqual(appIDs);
});

test('load multiple apps with same name via override', async () => {
    const appID = "test/simpletest";
    const appIDs: [AppID, ...AppID[]] = [appID, appID];
    const rfc = await genLoadFinalConfigWILLTHROW({appIDs});
    expect(Object.keys(rfc.appConfigs)).toEqual([appID]);
    expect(rfc.debug?.appIDsOverride).toEqual(appIDs);
});

// TODO: test loading by build
// TODO: test default load behavior for builds
// TODO: test default load behavior for builds
    //expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    //expect(rfc.buildConfig?.buildID).toBe(buildID);
test('load via build', async () => {
    const buildID = 'test/basic';
    const rfc = await genLoadFinalConfigWILLTHROW({buildID});
    expect(Object.keys(rfc.appConfigs)).toEqual(["test/simpletest", "test/simpletest_with_subapps"]);
    expect(rfc.buildConfig?.displayName).toBe("A test build config");
});

// TODO: test non-existent appid on creation (should throw? or default to CHHA_APPNAME in .from?)

test('create expected env vars', async () => {
    const expectedBase: IndexHtmlEnvVarPairs = {
        REACT_APP_LIBURRY_HTML_TITLE: "ORIG_DISPLAYNAME",
        REACT_APP_LIBURRY_HTML_THEME_COLOR: "ORIG_THEME_COLOR",
        REACT_APP_LIBURRY_HTML_OG_TITLE: "ORIG_OG_TITLE",
        REACT_APP_LIBURRY_HTML_OG_IMAGE: "ORIG_OG_IMAGE",
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: "ORIG_OG_DESC",
        REACT_APP_LIBURRY_WEBMANIFEST_PATH: "ORIG_MANIFEST?v=ORIG_MANIFEST_MD5",
        REACT_APP_LIBURRY_FAVICON_PATH: "ORIG_FAVICON",
    };

    const expectedAllOverride: IndexHtmlEnvVarPairs = {
        REACT_APP_LIBURRY_HTML_TITLE: "REPL_DISPLAYNAME",
        REACT_APP_LIBURRY_HTML_THEME_COLOR: "REPL_THEME_COLOR",
        REACT_APP_LIBURRY_HTML_OG_TITLE: "REPL_OG_TITLE",
        REACT_APP_LIBURRY_HTML_OG_IMAGE: "REPL_OG_IMAGE",
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: "REPL_OG_DESC",
        REACT_APP_LIBURRY_WEBMANIFEST_PATH: "REPL_MANIFEST?v=REPL_MANIFEST_MD5",
        REACT_APP_LIBURRY_FAVICON_PATH: "REPL_FAVICON",
        REACT_APP_LIBURRY_HTML_NOSCRIPT_ADDENDUM: "REPL_NOSCRIPT",
    };

    const defaultBuildConfig: RawDefaultBuildConfig = {
        displayName: "ORIG_DISPLAYNAME",
        apps: ["fake"],
        initialApp: "fake",
        indexHtml: {
            themeColor: "ORIG_THEME_COLOR",
            manifest: "ORIG_MANIFEST",
            favicon: "ORIG_FAVICON",
            og: {
                title: "ORIG_OG_TITLE",
                imageFullURL: "ORIG_OG_IMAGE",
                description: "ORIG_OG_DESC",
            }
        },
    };

    const buildConfig: RawBuildConfig = {
        displayName: "REPL_DISPLAYNAME",
        buildID: "fake",
        indexHtml: {
            themeColor: "REPL_THEME_COLOR",
            manifest: "REPL_MANIFEST",
            favicon: "REPL_FAVICON",
            og: {
                title: "REPL_OG_TITLE",
                imageFullURL: "REPL_OG_IMAGE",
                description: "REPL_OG_DESC",
            },
            noscript: "REPL_NOSCRIPT",
        },
    };


    const noConfig = await genIndexHTMLEnvVarPairs(defaultBuildConfig, undefined);
    expect(noConfig).toStrictEqual(expectedBase);

    const blankConfig = await genIndexHTMLEnvVarPairs(defaultBuildConfig, {buildID: "fake"});
    expect(blankConfig).toStrictEqual(expectedBase);

    const weirdButValidBlankIndexConfig = await genIndexHTMLEnvVarPairs(defaultBuildConfig, {buildID: "fake", indexHtml: {}});
    expect(weirdButValidBlankIndexConfig).toStrictEqual(expectedBase);

    const muhOg = "MUH_OG";
    const oneOverrideConfig = await genIndexHTMLEnvVarPairs(defaultBuildConfig, {buildID: "fake", indexHtml: {og: {title: muhOg}}});
    expect(oneOverrideConfig.REACT_APP_LIBURRY_HTML_OG_TITLE).toBe(muhOg);

    const fullConfig = await genIndexHTMLEnvVarPairs(defaultBuildConfig, buildConfig);
    expect(fullConfig).toStrictEqual(expectedAllOverride);
});
