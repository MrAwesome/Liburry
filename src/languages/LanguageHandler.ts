import Dialect from "./dialect";
import type {RawLangConfig} from "../configHandler/rawConfigTypes";

export default class LanguageHandler {
    private dialects: Dialect[];

    constructor(
        rawLangConfig: RawLangConfig,
    ) {
        this.dialects = [];
        for (const rawDialectID in rawLangConfig.dialects) {
            const rawDialect = rawLangConfig.dialects[rawDialectID];
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
