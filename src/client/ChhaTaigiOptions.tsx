import {AppID, PageID, SubAppID} from "./configHandler/zodConfigTypes";
import {SearcherType} from "./search/searchers/Searcher";
import {MainDisplayAreaMode} from "./types/displayTypes";

export default class OptionsChangeableByUser {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.DEFAULT;
    searcherType: SearcherType = SearcherType.FUZZYSORT;
    debug: boolean = false;
    savedQuery: string = "";
    playground: boolean = false;
    pageID: PageID | null = null;
    appID: AppID | null = null;
    subAppID: SubAppID | null = null;
}
