import {KnownDialectID} from "../generated/i18n";
import {AppID, PageID, SubAppID} from "./configHandler/zodConfigTypes";
import {SearcherType} from "./search/searchers/Searcher";
import {MainDisplayAreaMode} from "./types/displayTypes";

export default class OptionsChangeableByUser {
    mainMode: MainDisplayAreaMode = MainDisplayAreaMode.DEFAULT;
    searcherType: SearcherType = SearcherType.FUZZYSORT;
    debug = false;
    savedQuery = "";
    playground = false;
    dialectID: KnownDialectID = "eng_us";
    pageID?: PageID;
    appID?: AppID;
    subAppID?: SubAppID;
}
