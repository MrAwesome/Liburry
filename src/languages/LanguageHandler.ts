import {RawLanguage, RawLanguageSuperset} from "./types";

export default class LanguageHandler {
    constructor(
        private langBag: RawLanguageSuperset,
    ) {
        this.getAllLangs = this.getAllLangs.bind(this);
        this.getLangsHelper = this.getLangsHelper.bind(this);
    }

    getAllLangs(): Array<RawLanguage> {
        return this.getLangsHelper(this.langBag);
    }

    private getLangsHelper(languageSuperset: RawLanguageSuperset): Array<RawLanguage> {
        let output: Array<RawLanguage> = [];
        languageSuperset.subLangs.forEach((maybeSuper) => {
            if ((maybeSuper as RawLanguageSuperset).subLangs !== undefined) {
                const subSuper = maybeSuper as RawLanguageSuperset;
                output.push(...this.getLangsHelper(subSuper));
            } else {
                const lang = maybeSuper as RawLanguage;
                output.push(lang);
            }
        });
        return output;
    }
}
