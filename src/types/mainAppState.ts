import type {DBName} from "./dbTypes";
import type ChhaTaigiOptions from "../ChhaTaigiOptions";
import type SearchResultsHolder from "../SearchResultsHolder";
import FieldClassificationHandler, {PromHolder} from "../search/FieldClassificationHandler";

export interface ChhaTaigiState {
    options: ChhaTaigiOptions,
    resultsHolder: SearchResultsHolder,
    loadedDBs: Map<DBName, boolean>,
    fieldHandlerProm: PromHolder<FieldClassificationHandler>,
}

export type GetMainState = () => ChhaTaigiState;
export type SetMainState = (state: Partial<ChhaTaigiState> | ((prevState: ChhaTaigiState) => any)) => void;
