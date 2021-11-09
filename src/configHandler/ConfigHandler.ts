import {CONFIG_TARGET_JSON_FILENAME} from "../constants";
import {MuhError, MuhErrorType} from "../errorHandling/MuhError";
import {nodeReadFileFromDir} from "../utils";
import {ReturnedFinalConfig, returnedFinalConfigSchema} from "./zodConfigTypes";


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
    async genLoadFinalConfig(): Promise<ReturnedFinalConfig | MuhError> {
        try {
            const blob = await this.genLoadJSONText();
            const parseRes = await returnedFinalConfigSchema.spa(blob);
            if (parseRes.success === true) {
                return parseRes.data;
            } else {
                throw new MuhError(MuhErrorType.RFC_PARSE, parseRes.error);
            }
        } catch (e) {
            return handleMuhError(e);
        }
    }

    async genLoadFinalConfigLocal(): Promise<ReturnedFinalConfig> {
        return this.genLoadJSONText()
            .then((blob) => returnedFinalConfigSchema.parseAsync(blob));
    }
}

async function fetchJSON(): Promise<Object> {
    return fetch(CONFIG_TARGET_JSON_FILENAME)
        .catch((err) => {
            throw new MuhError(MuhErrorType.FETCH_THREW, err);
        }).then(async (resp: Response) => {
            if (resp.ok) {
                return resp.json()
                    .catch((err) => {
                        throw new MuhError(MuhErrorType.JSON_PARSE, err);
                    });
            } else {
                throw new MuhError(MuhErrorType.FETCH_NOTOK, resp);
            }
        })

}


async function fetchNode(): Promise<Object> {
    return nodeReadFileFromDir(
        "public/",
        CONFIG_TARGET_JSON_FILENAME
    ).then((text) => JSON.parse(text));
}

function handleMuhError(err: MuhError | any): MuhError {
    if ((err as MuhError).muhErrType !== undefined) {
        return err as MuhError;
    } else {
        return new MuhError(MuhErrorType.CONFIG_HANDLER_UNKNOWN, err);
    }
}
