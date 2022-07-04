import {KnownDialectID, KnownFontGroupID, KnownFontID} from "../../generated/i18n";
import {AppID, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {runningInJest} from "../utils";

export const FALLBACK_FONT_FAMILY = "sans-serif";

// TODO: determine why searchbar doesn't use noto sans
// TODO: debug why serviceworker doesn't cache the fonts (log from it?)

// TODO: Define these somewhere more appropriate (and/or generate them statically)

function getFontsForKnownFontGroup(rfc: ReturnedFinalConfig, fontGroupID: KnownFontGroupID) {
    return rfc.default.configs.fontConfig.config.fontGroups[fontGroupID]!;
}

function getFontConfigForKnownFontID(rfc: ReturnedFinalConfig, fontID: KnownFontID) {
    return rfc.default.configs.fontConfig.config.fonts[fontID]!;
}

// TODO:
// [] take fontnames
// [] make knownfontnames
// [] font for app -> font for interface -> fallback font
// (so can either take list of fontnames directly, or calculate the list from dialect + appname/subappname/etc)
//
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

        const fontGroupForDisplayDialect = rfc.default.configs.langConfig.config.dialects[currentDisplayDialect]!.requiredFontGroup as KnownFontGroupID | undefined;

        const fontIDsForDisplayDialect = fontGroupForDisplayDialect === undefined ? [] :
            getFontsForKnownFontGroup(rfc, fontGroupForDisplayDialect) as KnownFontID[];

        const fontIDs = [...fontIDsForApp, ...fontIDsForDisplayDialect];

        if (!runningInJest()) {
            // NOTE: this import must be dynamic, since FontFace isn't present at all in Jest.
            const {getFontLoaderForFontConfig} = await import("./CustomFontLoaders");

            const loaders = fontIDs.map((fontID) => {
                const fontConfig = getFontConfigForKnownFontID(rfc, fontID);
                return getFontLoaderForFontConfig(fontConfig);
            });
            // Load all fonts in all loaders
            Promise.all(loaders.map((l) => l.load()));

            // Add fonts to the DOM. For now, we just add to body, but the configs can take target classes later?
            const fontFamilies = loaders.map((l) => l.getFontFamilies()).flat();
            const uniqueFontFamilies = new Set(fontFamilies);

            // TODO: don't load except on a main font load?
            uniqueFontFamilies.add(FALLBACK_FONT_FAMILY);
            const newFontFamilyStr = Array.from(uniqueFontFamilies).join(", ");

            document.body.style.fontFamily = newFontFamilyStr;
        }
    }
}
