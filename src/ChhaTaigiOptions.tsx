import {SearcherType} from "./search";
import {MainDisplayAreaMode} from "./types/displayTypes";

export default class OptionsChangeableByUser {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    searcherType: SearcherType = SearcherType.FUZZYSORT;
    debug: boolean = false;
    savedQuery: string = "";
    playground: boolean = false;
}
