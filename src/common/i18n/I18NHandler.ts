// TODO: just import known DialectID from generatedtypes everywhere? can this be imported in a way that zod can verify the types without introducing a circular dependency?
//  import default first, validate it, then do the full finalconfig.
import {I18NTokens, DialectID} from "../../common/generatedTypes";

// TODO: make DialectID actually be read from default/lang.yml

export default interface I18NHandler {
    // Get the specified token for the current dialect
    tok: (tokenIdentifier: I18NTokens) => string,

    // Get the specified token for a specific dialect
    tokForDialect: (tokenIdentifier: I18NTokens, dialectID: DialectID) => string,

    //page: (pageNameToken: PageNameToken) => string,
}
