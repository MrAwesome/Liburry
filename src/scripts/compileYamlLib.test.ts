import {RawBuildConfig, RawDefaultBuildConfig} from "../client/configHandler/zodConfigTypes";
import {genIndexHTMLEnvVarPairs, IndexHtmlEnvVarPairs} from "./compileYamlLib";

test('create expected env vars', async () => {
    const expectedBase: IndexHtmlEnvVarPairs = {
        REACT_APP_LIBURRY_HTML_TITLE: "ORIG_DISPLAYNAME",
        REACT_APP_LIBURRY_HTML_THEME_COLOR: "ORIG_THEME_COLOR",
        REACT_APP_LIBURRY_HTML_OG_TITLE: "ORIG_OG_TITLE",
        REACT_APP_LIBURRY_HTML_OG_IMAGE: "ORIG_OG_IMAGE",
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: "ORIG_OG_DESC",
        REACT_APP_LIBURRY_MANIFEST_JSON_PATH: "ORIG_MANIFEST?v=ORIG_MANIFEST_MD5",
        REACT_APP_LIBURRY_FAVICON_PATH: "ORIG_FAVICON",
    };

    const expectedAllOverride: IndexHtmlEnvVarPairs = {
        REACT_APP_LIBURRY_HTML_TITLE: "REPL_DISPLAYNAME",
        REACT_APP_LIBURRY_HTML_THEME_COLOR: "REPL_THEME_COLOR",
        REACT_APP_LIBURRY_HTML_OG_TITLE: "REPL_OG_TITLE",
        REACT_APP_LIBURRY_HTML_OG_IMAGE: "REPL_OG_IMAGE",
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: "REPL_OG_DESC",
        REACT_APP_LIBURRY_MANIFEST_JSON_PATH: "REPL_MANIFEST?v=REPL_MANIFEST_MD5",
        REACT_APP_LIBURRY_FAVICON_PATH: "REPL_FAVICON",
        REACT_APP_LIBURRY_HTML_NOSCRIPT_ADDENDUM: "REPL_NOSCRIPT",
    };

    const defaultBuildConfig: RawDefaultBuildConfig = {
        displayName: "ORIG_DISPLAYNAME",
        apps: ["fake"],
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
