import {SearcherType} from "./search";
import {MainDisplayAreaMode} from "./types";

export default class ChaTaigiOptions {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.HOME;
    searcherType: SearcherType = SearcherType.FuzzySort;
    query: string = "";
    debug: boolean = false;
}
