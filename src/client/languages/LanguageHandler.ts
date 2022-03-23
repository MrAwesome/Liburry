import Dialect from "./dialect";
import {getRecordEntries} from "../utils";
import {RawLangConfig} from "../configHandler/zodLangConfigTypes";

export default class LanguageHandler {
    private dialects: Dialect[];

    constructor(
        rawLangConfig: RawLangConfig,
    ) {
        this.dialects = [];
        for (const [rawDialectID, rawDialect] of getRecordEntries(rawLangConfig.dialects)) {
            this.dialects.push(Dialect.from(rawDialectID, rawDialect));
        }
        this.getAllDialects = this.getAllDialects.bind(this);
    }

    static from(rawLangConfig: RawLangConfig): LanguageHandler {
        return new this(rawLangConfig);
    }

    getAllDialects(): Array<Dialect> {
        return this.dialects;
    }

}
