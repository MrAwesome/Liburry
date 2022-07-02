import {CustomFontConfig, FontConfig, SystemFontConfig} from "../configHandler/zodFontConfigTypes";

export type FontFamily = string;
export const FALLBACK_FONT_FAMILY: FontFamily = "sans-serif";

export function getFontLoaderForFontConfig(fc: FontConfig): IFontLoader {
    switch (fc.type) {
        case "custom":
            return CustomFontLoaderViaFontFace.from(fc);
        case "system":
            return SystemFontLoader.from(fc);
    }
}


export interface IFontLoader {
    // Get fonts from whichever system is configured, and load them into the DOM.
    load(): Promise<void>;
    getFontFamilies(): FontFamily[];
}

class CustomFontLoaderViaFontFace implements IFontLoader {
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

class SystemFontLoader implements IFontLoader {
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
