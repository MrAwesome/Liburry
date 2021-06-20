import type {DBName} from "./dbTypes";
import type ChhaTaigiOptions from "../ChhaTaigiOptions";
import type SearchResultsHolder from "../SearchResultsHolder";

export interface ChhaTaigiState {
    options: ChhaTaigiOptions,
    resultsHolder: SearchResultsHolder,
    loadedDBs: Map<DBName, boolean>,
}

export type GetMainState = () => ChhaTaigiState;
export type SetMainState = (state: Partial<ChhaTaigiState> | ((prevState: ChhaTaigiState) => any)) => void;
