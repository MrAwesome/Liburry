import {ReturnedFinalConfig} from "./zodConfigTypes";

export default interface ConfigHandler {
    genLoadFinalConfig(): Promise<ReturnedFinalConfig | Error>,
}
