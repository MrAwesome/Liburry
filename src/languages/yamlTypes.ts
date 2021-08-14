//type RawUniqueLangID = string;
//type RawUniqueDialectID = string;

export interface RawLangConfig {
//    languageGroups?: {
//        // NOTE: langID is a RawUniqueLangID (TypeScript doesn't allow type aliases in index signatures)
//        [langID: string]: RawLanguageGroup,
//    }
//
//    allowedTags?: {
//        [tag: string]: string,
//    }

    dialects: {
        // NOTE: langID is a RawUniqueDialectID (TypeScript doesn't allow type aliases in index signatures)
        [dialectID: string]: RawDialect,
    }
}

//export interface RawLanguageGroup {
//    defaultDialect: RawUniqueDialectID,
//    nameInDefaultDialect: string,
//    //parentGroups?: RawUniqueLangID[],
//    //isoCode639?: string,
//}

export interface RawDialect {
    displayName: string,
    //{ [otherDialectID: string]: string },
    namesForOtherDialects?: NamesForOtherDialects,
    //namesForOtherLangGroups?: { [dialectID: string]: string },
    //parentGroups?: RawUniqueLangID[],
    //letterCode?: string,
}

export interface NamesForOtherDialects {
    [dialectID: string]: string
}

// TODO: in verification, ensure:
//  [] all lang ids are unique
//  [] all dialect ids are unique
//  [] all lang/dialect ids are unique

