import {SearcherType} from "./search";
import type {DBLangType} from "./search/FieldClassificationHandler";
import {MainDisplayAreaMode} from "./types/displayTypes";

export default class ChhaTaigiOptions {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    searcherType: SearcherType = SearcherType.FUZZYSORT;
    query: string = "";
    debug: boolean = false;
    agnostic: boolean = false;
    playground: boolean = false;
    languageTEMPORARY: DBLangType = "poj";
}
