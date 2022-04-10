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


// Given a token ID load the translation corresponding to that token for
// the selected dialect. See src/common/i18n/I18NHandler.test.ts for examples.
//
// NOTE: lookups here could be sped up by caching (dialect+token = string) if necessary.
export default class I18NHandler {
    private dialectCaches: Map<KnownDialectID, Map<I18NToken, string>> = new Map();

    constructor(
        private rfc: ReturnedFinalConfig,
        private dialectID: KnownDialectID
    ) {
        this.tok = this.tok.bind(this);
        this.changeDialect = this.changeDialect.bind(this);
        this.tokForDialect = this.tokForDialect.bind(this);
        this.getTokenFromCache_or_FromChainAndPopulateCache =
            this.getTokenFromCache_or_FromChainAndPopulateCache.bind(this);
    }

    changeDialect(dialectID: KnownDialectID): void {
        this.dialectID = dialectID;
        //this.dialectChain = getDialectConfigAndFallbacks(this.rfc, dialectID)
    }

    // Get the specified token for the current dialect
    tok(tokenIdentifier: I18NToken): string {
        const {dialectID} = this;
        return this.getTokenFromCache_or_FromChainAndPopulateCache(tokenIdentifier, dialectID);
    }

    // Get the specified token for a specific dialect
    tokForDialect(tokenIdentifier: I18NToken, dialectID: KnownDialectID): string {
        return this.getTokenFromCache_or_FromChainAndPopulateCache(tokenIdentifier, dialectID);
    }

    private getTokenFromCache_or_FromChainAndPopulateCache(
        tokenIdentifier: I18NToken,
        dialectID: KnownDialectID
    ): string {
        const {dialectCaches} = this;
        let dialectCache = dialectCaches.get(dialectID);
        if (dialectCache === undefined) {
            dialectCache = new Map();
            dialectCaches.set(dialectID, dialectCache);
        }

        const cacheTok = dialectCache.get(tokenIdentifier);
        if (cacheTok !== undefined) {
            return cacheTok;
        }

        const dialectChain = getDialectConfigAndFallbacks(this.rfc, dialectID)
        const returnedTok = getTokenForDialectChain(tokenIdentifier, dialectChain);
        dialectCache.set(tokenIdentifier, returnedTok);

        return returnedTok;
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
