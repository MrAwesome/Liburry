import {RawBuildConfig, RawDefaultBuildConfig} from "../client/configHandler/zodConfigTypes";
import {genIndexHTMLEnvVarPairs, IndexHtmlEnvVarPairs} from "./compileYamlLib";

test('create expected env vars', async () => {
    const expectedBase: IndexHtmlEnvVarPairs = {
        REACT_APP_LIBURRY_HTML_TITLE: "ORIG",
        REACT_APP_LIBURRY_HTML_THEME_COLOR: "ORIG",
        REACT_APP_LIBURRY_HTML_OG_TITLE: "ORIG",
        REACT_APP_LIBURRY_HTML_OG_IMAGE: "ORIG",
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: "ORIG",
        REACT_APP_LIBURRY_MANIFEST_JSON_PATH: "ORIG",
        REACT_APP_LIBURRY_FAVICON_PATH: "ORIG",
    };

    const expectedAllOverride: IndexHtmlEnvVarPairs = {
        REACT_APP_LIBURRY_HTML_TITLE: "REPL",
        REACT_APP_LIBURRY_HTML_THEME_COLOR: "REPL",
        REACT_APP_LIBURRY_HTML_OG_TITLE: "REPL",
        REACT_APP_LIBURRY_HTML_OG_IMAGE: "REPL",
        REACT_APP_LIBURRY_HTML_OG_DESCRIPTION: "REPL",
        REACT_APP_LIBURRY_MANIFEST_JSON_PATH: "REPL",
        REACT_APP_LIBURRY_FAVICON_PATH: "REPL",
        REACT_APP_LIBURRY_HTML_NOSCRIPT_ADDENDUM: "REPL",
    };

    const defaultBuildConfig: RawDefaultBuildConfig = {
        displayName: "ORIG",
        apps: ["fake"],
        indexHtml: {
            themeColor: "ORIG",
            manifest: "ORIG",
            favicon: "ORIG",
            og: {
                title: "ORIG",
                imageFullURL: "ORIG",
                description: "ORIG",
            }
        },
    }

    const buildConfig: RawBuildConfig = {
        displayName: "REPL",
        indexHtml: {
            noscript: "REPL",
            themeColor: "REPL",
            manifest: "REPL",
            favicon: "REPL",
            og: {
                title: "REPL",
                imageFullURL: "REPL",
                description: "REPL",
            }
        },
        buildID: "fakkke"
    }


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
