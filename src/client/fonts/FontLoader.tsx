import AppConfig from "../configHandler/AppConfig";
import {CustomFontConfig, FontConfig, SystemFontConfig} from "../configHandler/zodFontConfigTypes";

// TODO: determine why searchbar doesn't use noto sans
// TODO: debug why serviceworker doesn't cache the fonts (log from it?)

type FontFamily = string;
const FALLBACK_FONT_FAMILY: FontFamily = "sans-serif";

export interface FontLoader {
    // Get fonts from whichever system is configured, and load them into the DOM.
    load(): Promise<void>;
    getFontFamilies(): FontFamily[];
}

export function getFontLoader(appConfig: AppConfig): FontLoader {
    const fontConfigs = appConfig.getAllFontConfigs();
    const loaders = fontConfigs.map(getFontLoaderForFontConfig);
    return new MetaFontLoader(loaders);
}

function getFontLoaderForFontConfig(fc: FontConfig): FontLoader {
    switch (fc.type) {
        case "custom":
            return CustomFontLoaderViaFontFace.from(fc);
        case "system":
            return SystemFontLoader.from(fc);
    }
}

// TODO: make this take fontfamily[]
class MetaFontLoader implements FontLoader {
    constructor(private loaders: FontLoader[]) {}

    async load() {
        // Load all fonts in all loaders
        Promise.all(this.loaders.map((l) => l.load()));

        // Add fonts to the DOM. For now, we just add to body, but the configs can take target classes later?
        const uniqueFontFamilies = new Set(this.getFontFamilies());
        uniqueFontFamilies.add(FALLBACK_FONT_FAMILY);
        const newFontFamilyStr = Array.from(uniqueFontFamilies).join(", ");
        document.body.style.fontFamily = newFontFamilyStr;
    }

    getFontFamilies() {
        return this.loaders.map((l) => l.getFontFamilies()).flat();
    }
}

class CustomFontLoaderViaFontFace implements FontLoader {
    constructor(private fontFace: FontFace) {}

    static from(cfc: CustomFontConfig): CustomFontLoaderViaFontFace {
        const {family, localUrl, descriptors} = cfc;
        const fontFace = new FontFace(family, `url(${localUrl})`, descriptors);
        return new CustomFontLoaderViaFontFace(fontFace);
    }

    async load(): Promise<void> {
        this.fontFace.load().then(async (loadedFace) => {
            document.fonts.add(loadedFace);
        });
    }

    getFontFamilies() {
        return [this.fontFace.family];
    }
}

class SystemFontLoader implements FontLoader {
    constructor(private family: FontFamily) {}

    static from(cfc: SystemFontConfig): SystemFontLoader {
        const {family} = cfc;
        return new SystemFontLoader(family);
    }

    // There's no need to load system fonts, we'll just add them to the DOM upstream.
    async load(): Promise<void> {}

    getFontFamilies() {
        return [this.family];
    }
}
