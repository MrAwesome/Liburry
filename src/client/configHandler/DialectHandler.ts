import {KnownDialectID} from "../../common/generatedTypes";
import {RawDialect, RawLangConfig} from "./zodLangConfigTypes";

export default class DialectHandler {
    constructor(
        private langConfig: RawLangConfig,
    ) {}

    getDefaultDialectID(): KnownDialectID {
        return this.langConfig.defaultDialectID as KnownDialectID;
    }

    getDefaultDialect(): RawDialect {
        return this.langConfig.dialects[this.langConfig.defaultDialectID]!;
    }

    getAllDialects(): typeof this.langConfig.dialects {
        return this.langConfig.dialects;
    }

    getDialect(kdid: KnownDialectID): RawDialect {
        const targetDialect = this.langConfig.dialects[kdid];
        if (targetDialect !== undefined) {
            return targetDialect;
        } else {
            const {defaultDialectID} = this.langConfig;
            console.warn(`Unknown dialect "${kdid}", falling back to default dialect "${defaultDialectID}"`);
            return this.langConfig.dialects[defaultDialectID]!;
        }
    }
}
