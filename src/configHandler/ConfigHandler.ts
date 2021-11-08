import {CONFIG_TARGET_JSON_FILENAME} from "../constants";
import {nodeReadFileFromDir} from "../utils";
import {ReturnedFinalConfig, returnedFinalConfigSchema} from "./zodConfigTypes";

enum CHErrorType {
    FETCH_NOTOK = "FETCH_NOTOK",
    FETCH_THREW = "FETCH_THREW",
    JSON_PARSE = "JSON_PARSE",
    RFC_PARSE = "RFC_PARSE",
    UNKNOWN = "UNKNOWN",
}

export class CHError extends Error {
    chErrMessage?: string | undefined;
    constructor(
        public chErrType: CHErrorType,
        public unknownErr?: any,
    ) {
        super(unknownErr.message);
        this.chErrMessage = unknownErr.message;
    }
}
export default class ConfigHandler {
    constructor(
        private localMode = false,
    ) {}

    private async genLoadJSONText(): Promise<Object> {
        if (this.localMode) {
            return fetchNode();
        } else {
            return fetchJSON();
        }
    }

    // NOTE: this can load an app-specific config, if that's desired instead
    async genLoadFinalConfig(): Promise<ReturnedFinalConfig | CHError> {
        return this.genLoadJSONText()
            .then((blob) => returnedFinalConfigSchema.spa(blob))
            .then((parseRes) => {
                if (parseRes.success === true) {
                    return parseRes.data;
                } else {
                    throw new CHError(CHErrorType.RFC_PARSE, parseRes.error);
                }
            })
            .catch((err) => {
                if ((err as CHError).chErrType !== undefined) {
                    return err;
                } else {
                    return new CHError(CHErrorType.UNKNOWN, err);
                }
            });
    }

    async genLoadFinalConfigLocal(): Promise<ReturnedFinalConfig> {
        return this.genLoadJSONText()
            .then((blob) => returnedFinalConfigSchema.parseAsync(blob));
    }
}

async function fetchJSON(): Promise<Object> {
    return fetch(CONFIG_TARGET_JSON_FILENAME)
        .catch((err) => {
            throw new CHError(CHErrorType.FETCH_THREW, err);
        }).then((resp: Response) => {
            if (resp.ok) {
                return resp.json();
            } else {
                throw new CHError(CHErrorType.FETCH_NOTOK, resp);
            }
        }).catch((err) => {
            throw new CHError(CHErrorType.JSON_PARSE, err);
        });
}


async function fetchNode(): Promise<Object> {
    return nodeReadFileFromDir(
        "public/",
        CONFIG_TARGET_JSON_FILENAME
    ).then((text) => JSON.parse(text));
}
