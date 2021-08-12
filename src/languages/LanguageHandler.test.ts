import LanguageHandler from "./LanguageHandler";
import {RawLanguage, RawLanguageSuperset} from "./types";


const TW_POJ: RawLanguage = {
    langID: "tw_poj",
    displayNames: {
        english: "Taiwanese (POJ)",
        tw_poj: "Pe̍h-ōe-jī",
        tw_kip: "Pe̍h-uē-jī",
        mandarin: "白話字",
        taibun: "白話字",
        taibun_poj: "白話字",
        taibun_kip: "白話字",
    }
};

const ENGLISH: RawLanguage = {
    langID: "english",
    displayNames: {
        english: "English",
        tw_poj: "Eng-gí",
        tw_kip: "Ing-gí",
        mandarin: "英語",
        taibun: "英語",
        taibun_poj: "英語",
        taibun_kip: "英語",
    }
};

// TODO: tag languages with "lang:dialect" ids and lang_family ids, instead of storing in a hierarchical way?

// TODO: the root node shouldn't be this?
test('return all langs', async () => {

});
