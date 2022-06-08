// TODO: just import known DialectID from generatedtypes everywhere? can this be imported in a way that zod can verify the types without introducing a circular dependency?
//  import default first, validate it, then do the full finalconfig.
import {ReturnedFinalConfig} from "../../client/configHandler/zodConfigTypes";
import {RawDialect} from "../../client/configHandler/zodLangConfigTypes";
import {runningInJest} from "../../client/utils";
import type {I18NToken, KnownDialectID} from "../../common/generatedTypes";
import {i18nTokenIDsSet} from "../../generated/i18n";


interface KnownDialectIDChain {
    chosenDialectID: KnownDialectID,
    fallbackDialectIDs: KnownDialectID[],
    defaultDialectID: KnownDialectID,
}

interface RawDialectConfigChain {
    chosenDialect: RawDialect,
    fallbackDialects: RawDialect[],
    defaultDialect: RawDialect,
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
        this.getKnownDialectIDChain = this.getKnownDialectIDChain.bind(this);
        this.getKnownDialectIDChainAsList = this.getKnownDialectIDChainAsList.bind(this);
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

    isTok(maybeToken: string): maybeToken is I18NToken {
        return i18nTokenIDsSet.has(maybeToken as I18NToken);
    }

    // Get the specified token for a specific dialect
    tokForDialect(tokenIdentifier: I18NToken, dialectID: KnownDialectID): string {
        return this.getTokenFromCache_or_FromChainAndPopulateCache(tokenIdentifier, dialectID);
    }

    getKnownDialectIDChain(): KnownDialectIDChain {
        const {rfc, dialectID} = this;
        return getKnownDialectChain(rfc, dialectID);
    }

    getKnownDialectIDChainAsList(): KnownDialectID[] {
        const {chosenDialectID, fallbackDialectIDs, defaultDialectID} = this.getKnownDialectIDChain();
        return [chosenDialectID, ...fallbackDialectIDs, defaultDialectID];
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

function getKnownDialectChain(rfc: ReturnedFinalConfig, dialectID: KnownDialectID): KnownDialectIDChain {
    const {dialects, defaultDialectID} = rfc.default.configs.langConfig.config;

    const chosenDialectID = dialectID;
    // TODO: XXX: ensure in zod that these really are knowndialectids
    const fallbackDialectIDs = (dialects[dialectID]!.fallbacks ?? []) as KnownDialectID[];
    return {chosenDialectID, fallbackDialectIDs, defaultDialectID: defaultDialectID as KnownDialectID};
}


function getDialectConfigAndFallbacks(rfc: ReturnedFinalConfig, dialectID: KnownDialectID): RawDialectConfigChain {
    const {dialects} = rfc.default.configs.langConfig.config;
    const {chosenDialectID, fallbackDialectIDs, defaultDialectID} = getKnownDialectChain(rfc, dialectID);


    const chosenDialect = dialects[chosenDialectID]!;
    const defaultDialect = dialects[defaultDialectID]!;

    const fallbackDialects = fallbackDialectIDs.map((diname) => dialects[diname]!);
    return {chosenDialect, fallbackDialects, defaultDialect};
}

function getTokenForDialectChain(
    tokenIdentifier: I18NToken,
    dialectChain: RawDialectConfigChain,
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
