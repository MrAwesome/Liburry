// (Replaced by zod configs)
export default {}
//
//export interface RawAppConfig {
//    displayName: string,
//    // TODO: displayNames?
//    // ...
//}
//
//export interface RawLangConfig {
//    //    languageGroups?: {
//    //        // NOTE: langID is a RawUniqueLangID (TypeScript doesn't allow type aliases in index signatures)
//    //        [langID: string]: RawLanguageGroup,
//    //    }
//    //
//    //    allowedTags?: {
//    //        [tag: string]: string,
//    //    }
//
//    dialects: {
//        // NOTE: langID is a RawUniqueDialectID (TypeScript doesn't allow type aliases in index signatures)
//        [rawDialectID: string]: RawDialect,
//    }
//}
//
////export interface RawLanguageGroup {
////    defaultDialect: RawUniqueDialectID,
////    nameInDefaultDialect: string,
////    //parentGroups?: RawUniqueLangID[],
////    //isoCode639?: string,
////}
//
//export interface RawDialect {
//    displayName: string,
//    //{ [otherDialectID: string]: string },
//    //
//    namesForOtherDialects?: {
//        [rawDialectID: string]: string
//    },
//    //namesForOtherLangGroups?: { [dialectID: string]: string },
//    //parentGroups?: RawUniqueLangID[],
//    //letterCode?: string,
//}
//
//export interface RawAllDBConfig {
//    [dbIdentifier: string]: RawDBConfig,
//}
//
//export interface RawDBConfig {
//    enabled?: boolean,
//    displayName: {
//        [rawDialectID: string]: string,
//    }
//    primaryKey: string,
//    loadInfo: RawDBLoadInfo,
//    fields: {
//        [rawFieldID: string]: RawAllowedFieldClassifierTags,
//    },
//}
//
//export interface RawDBLoadInfo {
//    localCSV?: string,
//    localLunr?: string,
//}
//
//export interface RawAllowedFieldClassifierTags {
//    // The general type data this field contains (vocab, definition, link, etc)
//    // // TODO: XXX: if type isn't defined, what does that mean? just ignore the field?
//    type?: RawKnownDisplayTypeEntry,
//
//    // The dialect ID for a given dialect
//    dialect?: string | string[],
//
//    delimiter?: string,
//    delimiterRegex?: string,
//    lengthHint?: string,
//    status?: string,
//    notes?: string,
//}
//
//// TODO: in verification, ensure:
////  [] all dialect ids are unique
//
//export interface RawMenuConfig {
//    links: RawMenuLinks,
//}
//
//export interface RawMenuLinks {
//    [linkName: string]: {
//        mode: RawMenuLinkMode,
//        displayNames: {
//            [displayName: string]: string,
//        }
//    }
//}
//
//// Potential future modes: reactcomponent, html
//export type RawMenuLinkMode = "search" | "markdown";
//
//export interface RawKnownDisplayTypeEntry {
//    dictionary?: RawDictionaryFieldDisplayType,
//    fake_mtg?: FakeMTGDisplayType,
//}
//
//export type FakeMTGDisplayType = "fake_mtg" | "mtg_fake";
//
//// NOTE: this are still somewhat specific to taigi.us - can they be abstracted per-app?
//// NOTE: for perf, this can/could be an enum (doubtful that it will matter for a long, long time)
//export type RawDictionaryFieldDisplayType =
//    "base_phrase" |
//    "channel_name" |
//    "class" |
//    "contributor" |
//    "date_YYYY.MM.DD" |
//    "dbname" |
//    "definition" |
//    "example" |
//    "example_phrase" |
//    "explanation" |
//    "id" |
//    "input" |
//    "input_other" |
//    "link" |
//    "matched_example" |
//    "measure_word" |
//    "normalized" |
//    "normalized_other" |
//    "opposite" |
//    "page_number" |
//    "pos_classification" |
//    "see_also" |
//    "synonym" |
//    "type" |
//    "UNKNOWN" |
//    "vocab" |
//    "vocab_other";
