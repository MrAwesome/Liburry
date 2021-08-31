import {SearcherType} from "./search";
import {MainDisplayAreaMode} from "./types/displayTypes";

export type AppName = string;

export default class OptionsChangeableByUser {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    searcherType: SearcherType = SearcherType.FUZZYSORT;
    debug: boolean = false;
    agnostic: boolean = false;
    savedQuery: string = "";
    playground: boolean = false;
    // TODO: find a way to load this dynamically
    appName: AppName = "taigi.us";
}
