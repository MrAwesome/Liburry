export enum MuhErrorType {
    FETCH_NOTOK = "FETCH_NOTOK",
    FETCH_THREW = "FETCH_THREW",
    JSON_PARSE = "JSON_PARSE",
    RFC_PARSE = "RFC_PARSE",
    CONFIG_HANDLER_UNKNOWN = "CONFIG_HANDLER_UNKNOWN",
}

export class MuhError extends Error {
    muhErrMessage: string;
    constructor(
        public muhErrType: MuhErrorType,
        public unknownErr: any,
    ) {
        super(unknownErr.message);
        // It's fine if message is undefined, but if it's there we want to pass it on.
        this.muhErrMessage = unknownErr.message ?? "<not found>";
    }
}
