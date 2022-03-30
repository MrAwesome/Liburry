// TODO: just import known DialectID from generatedtypes everywhere? can this be imported in a way that zod can verify the types without introducing a circular dependency?
//  import default first, validate it, then do the full finalconfig.
import {ReturnedFinalConfig} from "../../client/configHandler/zodConfigTypes";
import {RawDialect} from "../../client/configHandler/zodLangConfigTypes";
import {runningInJest} from "../../client/utils";
import type {I18NToken, KnownDialectID} from "../../common/generatedTypes";

interface DialectChain {
    chosenDialect: RawDialect,
    fallbackDialects: RawDialect[],
    defaultDialect: RawDialect
}

export default class I18NHandler {
    private dialectChain: DialectChain;

    constructor(
        private rfc: ReturnedFinalConfig,
        dialectID: KnownDialectID
    ) {
        this.dialectChain = getDialectConfigAndFallbacks(this.rfc, dialectID)
    }

    changeDialect(dialectID: KnownDialectID): void {
        this.dialectChain = getDialectConfigAndFallbacks(this.rfc, dialectID)
    }

    // Get the specified token for the current dialect
    tok(tokenIdentifier: I18NToken): string {
        return getTokenForDialectChain(tokenIdentifier, this.dialectChain);
    }

    // Get the specified token for a specific dialect
    //
    // NOTE: This can trivially be memoized.
    tokForDialect(tokenIdentifier: I18NToken, dialectID: KnownDialectID): string {
        const chainForSpecifiedDialect = getDialectConfigAndFallbacks(this.rfc, dialectID)
        return getTokenForDialectChain(tokenIdentifier, chainForSpecifiedDialect);
    }
}

function getDialectConfigAndFallbacks(rfc: ReturnedFinalConfig, dialectID: KnownDialectID): DialectChain {
    const {dialects, defaultDialectID} = rfc.default.configs.langConfig.config;

    // TODO: XXX: error checking / type assurances, keyof etc
    const chosenDialect = dialects[dialectID]!;
    const defaultDialect = dialects[defaultDialectID]!;

    const fallbackDialects = (chosenDialect.fallbacks ?? [])
        // TODO: XXX: error checking / type assurances
        .map((diname) => dialects[diname]!);
    return {chosenDialect, fallbackDialects, defaultDialect};
}

function getTokenForDialectChain(
    tokenIdentifier: I18NToken,
    dialectChain: DialectChain,
): string {
    const {chosenDialect, fallbackDialects, defaultDialect} = dialectChain;
    const dialects = [chosenDialect, ...fallbackDialects, defaultDialect];
    for (const dialect of dialects) {
        const tok = dialect.tokens?.[tokenIdentifier];
        if (tok !== undefined) {
            return tok;
        }
    }

    // This should in practice never happen, as we should fail to pass the typechecker 
    // since we statically generate all token names that are known to exist on the default lang.
    const msg = `Unknown token "${tokenIdentifier}"! This is a bug, please report it.`;
    if (runningInJest()) {
        throw new Error(msg);
    }
    console.error(msg);
    return tokenIdentifier;
}
