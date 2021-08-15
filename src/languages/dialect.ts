import {RawDialect} from "./rawConfigTypes";

export type DialectID = string;

export default class Dialect {
    constructor(
        private dialectID: DialectID,
        private displayName: string,

        // TODO: for later use - the handler can also just preserve these mappings.
        //private namesForOtherDialects?: {
        //    [rawDialectID: string]: string
        //}
    ) {

    }

    static from(rawDialectID: string, r: RawDialect): Dialect {
        return new Dialect(
            rawDialectID,
            r.displayName,
            //r.namesForOtherDialects,
        );

    }

    getID(): DialectID {
        return this.dialectID;
    }

    getDisplayName(): string {
        return this.displayName;
    }
}
