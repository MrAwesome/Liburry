type RawLanguageSupersetIdentifier = string;
type RawLanguageIdentifier = string;
type RawLanguageFamilyIdentifier = string;

export interface LanguageFamily {
    familyID: RawLanguageFamilyIdentifier,
    // NOTE: lang is a RawLanguageIdentifier (TypeScript doesn't allow type aliases in index signatures)
    displayNames: { [lang: string]: string },
}

export interface RawLanguageSuperset {
    supersetID: RawLanguageSupersetIdentifier,
    subLangs: Array<RawLanguageSuperset | RawLanguage>,
    // NOTE: lang is a RawLanguageIdentifier (TypeScript doesn't allow type aliases in index signatures)
    displayNames: { [lang: string]: string },
}

export interface RawLanguage {
    langID: RawLanguageIdentifier,
    // NOTE: lang is a RawLanguageIdentifier (TypeScript doesn't allow type aliases in index signatures)
    displayNames: { [lang: string]: string },
    families?: LanguageFamily[],
    letterCode?: string,
}

