import {SearcherType} from "./search";
import {MainDisplayAreaMode} from "./types/displayTypes";

export default class ChhaTaigiOptions {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    searcherType: SearcherType = SearcherType.FuzzySort;
    query: string = "";
    debug: boolean = false;
}
