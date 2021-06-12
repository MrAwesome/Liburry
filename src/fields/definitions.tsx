import {LangField, Langs} from "../types/dbTypes";
import {makeNameToObjMapping} from "../utils";

const pojUnicode = {
    name: "poj_unicode",
    lang: Langs.POJ,
    area: "key",
    priority: 0,
} as LangField;

const english = {
    name: "english",
    lang: Langs.ENGLISH,
    area: "definition",
    priority: 0,
} as LangField;

const hoabun = {
    name: "hoabun",
    lang: Langs.MANDO,
    area: "definition",
    priority: 1,
} as LangField;

const pojInput = {
    name: "poj_input",
    lang: Langs.POJ_TYPING_INPUT,
    area: "alt-text",
    priority: 0,
} as LangField;

const pojNormalized = {
    name: "poj_normalized",
    lang: Langs.POJ_NORMALIZED,
    area: "alt-text",
    priority: 2,
} as LangField;

let gikuFake = makeNameToObjMapping([pojUnicode, pojInput, pojNormalized]);

//export const PojNormalized: TextEntryTag = class {
//    
//}
//
//type AltText = PojTypingInput | PojNormalized;

    // TODO: settings for showing/indexing these only if they're requested
    //    {
    //        name: "kip_unicode",
    //        lang: Langs.KIP,
    //        area: "key",
    //        priority: 1,
    //    },
//    {
//        name: "english",
//        lang: Langs.ENGLISH,
//        area: "definition",
//        priority: 0,
//    },
    //    {
    //        name: "english_soatbeng",
    //        lang: Langs.ENGLISH,
    //        area: "explanation",
    //        priority: 0,
    //    },
//    {
//        name: "hoabun",
//        lang: Langs.MANDO,
//        area: "definition",
//        priority: 1,
//    },
//    {
//        name: "pojTypingInput",
//        lang: Langs.POJ_TYPING_INPUT,
//        area: "alt-text",
//        priority: 0,
//    },
//    {
//        // TODO: this needs to be generated
//        name: "pojNormalized",
//        lang: Langs.POJ_NORMALIZED,
//        area: "alt-text",
//        priority: 2,
//    },

