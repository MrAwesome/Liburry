import {FINAL_CONFIG_JSON_FILENAME, FINAL_CONFIG_LOCAL_DIR, FINAL_CONFIG_REMOTE_DIR} from "../constants";
import {MuhError, MuhErrorType} from "../errorHandling/MuhError";
import {nodeReadFileFromDir} from "../utils";
import {ReturnedFinalConfig, returnedFinalConfigSchema} from "./zodConfigTypes";

// [] ensure app names are unique
// [] allow slashes in appnames (how to handle this in zod?)
// [] load default.json
// [] load appname.json
// [] handle selecting subapp elsewhere

// TODO: add app name here, in remote/local location, or base location on appname
const chDefaultOpts = {
    localMode: false,
    shouldFailToLoad: false,
    testRFCOverrideJSONText: null as string | null,
    finalConfigLocalDir: FINAL_CONFIG_LOCAL_DIR,
    finalConfigRemoteDir: FINAL_CONFIG_REMOTE_DIR,
    finalConfigJsonFilename: FINAL_CONFIG_JSON_FILENAME,
};
type CHOpts = typeof chDefaultOpts;

export default class CompiledJSONFinalConfigHandler {
    private opts: CHOpts;
    constructor(
        opts?: Partial<CHOpts>,
    ) {
        this.opts = {
            ...chDefaultOpts,
            ...opts,
        };

        this.localLoadWithNode = this.localLoadWithNode.bind(this);
        this.fetchJSON = this.fetchJSON.bind(this);
        this.genLoadJSON = this.genLoadJSON.bind(this);
        this.genLoadFinalConfig = this.genLoadFinalConfig.bind(this);
        this.genLoadFinalConfigLocalUNSAFE = this.genLoadFinalConfigLocalUNSAFE.bind(this);
    }

    private async genLoadJSON(): Promise<Object> {
        const {shouldFailToLoad, testRFCOverrideJSONText, localMode} = this.opts;
        if (shouldFailToLoad) {
            throw new MuhError(MuhErrorType.EXPLICIT_FAILURE_REQUESTED);
        }
        if (testRFCOverrideJSONText) {
            return JSON.parse(testRFCOverrideJSONText);
        }
        if (localMode) {
            return this.localLoadWithNode();
        } else {
            return this.fetchJSON();
        }
    }

    // NOTE: this can load an app-specific config, if that's desired instead
    async genLoadFinalConfig(): Promise<ReturnedFinalConfig | MuhError> {
        try {
            const blob = await this.genLoadJSON();
            const parseRes = await returnedFinalConfigSchema.spa(blob);
            if (parseRes.success === true) {
                return parseRes.data;
            } else {
                console.info("Parsing error: ", parseRes.error.issues);
                console.info("On data: ", blob);
                throw new MuhError(MuhErrorType.RFC_PARSE, parseRes.error);
            }
        } catch (e) {
            return handleMuhError(e);
        }
    }

    // Will throw on parse errors. Should only be used in tests.
    async genLoadFinalConfigLocalUNSAFE(): Promise<ReturnedFinalConfig> {
        return this.genLoadJSON()
            .then((blob) => returnedFinalConfigSchema.parseAsync(blob, {errorIncludesInputData: true}));
    }

    async fetchJSON(): Promise<Object> {
        const {finalConfigRemoteDir, finalConfigJsonFilename} = this.opts;
        return fetch(finalConfigRemoteDir + finalConfigJsonFilename)
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


    async localLoadWithNode(): Promise<Object> {
        const path = await import("path");
        return nodeReadFileFromDir(
            path.join("public/", this.opts.finalConfigLocalDir),
            this.opts.finalConfigJsonFilename,
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
