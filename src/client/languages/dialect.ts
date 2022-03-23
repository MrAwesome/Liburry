import {RawDialect} from "../configHandler/zodLangConfigTypes";

export type DialectID = string;

//export type Language =
//    "eng_us" |
//    "mandarin" |
//    "hok_tw_poj" |
//    "tw_kip" |
//    "tw_taibun_only" |
//    "tw_taibun_poj" |
//    "tw_taibun_kip";


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
