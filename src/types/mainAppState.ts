import type {DBName} from "./dbTypes";
import type ChhaTaigiOptions from "../ChhaTaigiOptions";
import type SearchResultsHolder from "../SearchResultsHolder";
import type FieldClassificationHandler from "../search/FieldClassificationHandler";

export interface ChhaTaigiState {
    options: ChhaTaigiOptions,
    resultsHolder: SearchResultsHolder,
    loadedDBs: Map<DBName, boolean>,
    fieldHandler: FieldClassificationHandler | null;
}

export type GetMainState = () => ChhaTaigiState;
export type SetMainState = (state: Partial<ChhaTaigiState> | ((prevState: ChhaTaigiState) => any)) => void;
