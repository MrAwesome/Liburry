import {KnownDialectID, KnownFontGroupID, KnownFontID} from "../../generated/i18n";
import {AppID, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {runningInJest} from "../utils";

export const FALLBACK_FONT_FAMILY = "sans-serif";

// TODO: determine why searchbar doesn't use noto sans
// TODO: debug why serviceworker doesn't cache the fonts (log from it?)
// TODO: add unit/integration tests (difficult, with FontFace being undefined in Jest)

function getFontsForKnownFontGroup(rfc: ReturnedFinalConfig, fontGroupID: KnownFontGroupID) {
    return rfc.default.configs.fontConfig.config.fontGroups[fontGroupID]!;
}

function getFontConfigForKnownFontID(rfc: ReturnedFinalConfig, fontID: KnownFontID) {
    return rfc.default.configs.fontConfig.config.fonts[fontID]!;
}

export default class FontLoader {
    constructor(
        private rfc: ReturnedFinalConfig,
    ) {}

    async load(
        currentAppID: AppID,
        currentDisplayDialect: KnownDialectID
    ) {
        const {rfc} = this;
        const fontGroupsForApp = rfc.appConfigs[currentAppID]!.configs.appConfig.config.fontGroups as KnownFontGroupID[] | undefined;

        const fontIDsForApp = fontGroupsForApp === undefined ? [] :
            fontGroupsForApp.flatMap((fontGroup) => getFontsForKnownFontGroup(rfc, fontGroup)) as KnownFontID[];

        const fontGroupsForDisplayDialect = rfc.default.configs.langConfig.config.dialects[currentDisplayDialect]!.requiredFontGroups as KnownFontGroupID[] | undefined;

        const fontIDsForDisplayDialect = fontGroupsForDisplayDialect === undefined ? [] :
            fontGroupsForDisplayDialect.flatMap((fontGroup) => getFontsForKnownFontGroup(rfc, fontGroup)) as KnownFontID[];

        if (!runningInJest()) {
            // NOTE: this import must be dynamic, since FontFace isn't present at all in Jest.
            const {getFontLoaderForFontConfig} = await import("./CustomFontLoaders");

            const getLoaderForFontID = (fontID: KnownFontID) => {
                const fontConfig = getFontConfigForKnownFontID(rfc, fontID);
                return getFontLoaderForFontConfig(fontConfig);
            };

            const loadersForApp = fontIDsForApp.map(getLoaderForFontID);
            const loadersForDisplayDialect = fontIDsForDisplayDialect.map(getLoaderForFontID);

            const loaders = [...loadersForApp, ...loadersForDisplayDialect];

            // Load all fonts in all loaders
            // TODO: test if this should be awaited, or is fine to keep loading asynchronously
            Promise.all(loaders.map((l) => l.load()));

            // Add app-defined fonts directly to the DOM, as the default font for the body.
            const fontFamilies = loadersForApp.map((l) => l.getFontFamilies()).flat();
            const uniqueFontFamilies = new Set(fontFamilies);

            // TODO: don't load except on a main font load?
            uniqueFontFamilies.add(FALLBACK_FONT_FAMILY);
            const newFontFamilyStr = Array.from(uniqueFontFamilies).join(", ");

            document.body.style.fontFamily = newFontFamilyStr;
        }
    }
}
