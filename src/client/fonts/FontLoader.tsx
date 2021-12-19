import AppConfig from "../configHandler/AppConfig";
import {CustomFontConfig, FontConfig} from "../configHandler/zodFontConfigTypes";

// TODO: determine why searchbar doesn't use noto sans
// TODO: debug why serviceworker doesn't cache the fonts (log from it?)

export function getFontLoader(appConfig: AppConfig): FontLoader {
    const fontConfigs = appConfig.getAllFontConfigs();
    const loaders = fontConfigs.map(getFontLoaderForFontConfig);
    return new MetaFontLoader(loaders);
}

function getFontLoaderForFontConfig(fc: FontConfig): FontLoader {
    switch (fc.type) {
        case "custom":
            return CustomFontLoaderViaFontFace.from(fc);
    }
}

export interface FontLoader {
    load(): Promise<void>;
}

class MetaFontLoader implements FontLoader {
    constructor(private loaders: FontLoader[]) {}
    async load() {
        Promise.all(this.loaders.map((l) => l.load()));
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
}
