import {SearcherType} from "./search";
import type {DBLangType} from "./search/FieldClassificationHandler";
import {MainDisplayAreaMode} from "./types/displayTypes";

export type AppName = string;

export default class ChhaTaigiOptions {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    searcherType: SearcherType = SearcherType.FUZZYSORT;
    query: string = "";
    debug: boolean = false;
    agnostic: boolean = false;
    playground: boolean = false;
    languageTEMPORARY: DBLangType = "poj";
    // TODO: find a way to load this dynamically
    appName: AppName = "taigi.us";
}
