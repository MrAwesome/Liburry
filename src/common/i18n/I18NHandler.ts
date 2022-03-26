import {DialectID} from "../../client/languages/dialect";

// TODO: make DialectID actually be read from default/lang.yml

export default interface I18NHandler<TT, TI> {
    tok: (tokenType: TT, tokenIdentifier: TI) => string,
    getTokenForAllEnabledDialectsInCurrentApp: (tokenType: TT, tokenIdentifier: TI) => string[],
    getTokenForSpecificDialect: (tokenType: TT, tokenIdentifier: TI, dialectID: DialectID) => string[],
}
