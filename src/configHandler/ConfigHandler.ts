import {FINAL_CONFIG_LOCAL_LOCATION, FINAL_CONFIG_REMOTE_LOCATION} from "../constants";
import {MuhError, MuhErrorType} from "../errorHandling/MuhError";
import {nodeReadFileFromDir} from "../utils";
import {ReturnedFinalConfig, returnedFinalConfigSchema} from "./zodConfigTypes";


// TODO: add app name here, in remote/local location, or base location on appname
const chDefaultOpts = {
    localMode: false,
    finalConfigLocalLocation: FINAL_CONFIG_LOCAL_LOCATION,
    finalConfigRemoteLocation: FINAL_CONFIG_REMOTE_LOCATION,
};
type CHOpts = typeof chDefaultOpts;

export default class ConfigHandler {
    private opts: CHOpts;
    constructor(
        opts?: Partial<CHOpts>,
    ) {
        this.opts = {
            ...chDefaultOpts,
            ...opts,
        };

        this.fetchNode = this.fetchNode.bind(this);
        this.fetchJSON = this.fetchJSON.bind(this);
        this.genLoadJSONText = this.genLoadJSONText.bind(this);
        this.genLoadFinalConfig = this.genLoadFinalConfig.bind(this);
        this.genLoadFinalConfigLocal = this.genLoadFinalConfigLocal.bind(this);
    }

    private async genLoadJSONText(): Promise<Object> {
        if (this.opts.localMode) {
            return this.fetchNode();
        } else {
            return this.fetchJSON();
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

    async fetchJSON(): Promise<Object> {
        return fetch(this.opts.finalConfigRemoteLocation)
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


    async fetchNode(): Promise<Object> {
        return nodeReadFileFromDir(
            "public/",
            this.opts.finalConfigLocalLocation,
        ).then((text) => JSON.parse(text));
    }
}


function handleMuhError(err: MuhError | any): MuhError {
    if ((err as MuhError).muhErrType !== undefined) {
        return err as MuhError;
    } else {
        return new MuhError(MuhErrorType.CONFIG_HANDLER_UNKNOWN, err);
    }
}
