// What counts as a valid "token" - app names, dialect names, etc all will be validated against this.
// Deliberately restrictive and ASCII-centric, for simplicity of parsing/typing.
// Tokens should never be displayed to users (everything which has a token should also have a "displayName"
// if it needs one), so this only affects i18n for programmers.
const BASIC_TOKEN_REGEX = /^[a-zA-Z0-9_]+$/;
const FILENAME_AND_DIRECTORY_SAFE_REGEX = /^[a-zA-Z0-9_/.]+$/;
const LOCAL_FILENAME_AND_DIRECTORY_SAFE_REGEX = /^\/[a-zA-Z0-9_/.]+$/;

// Token Types
// NOTE: all of this type-glop is just to allow us to define the keys once while still being able to enforce the types of the values
type TokenMatcher = Readonly<[RegExp, string] | null>;
type TokenList<T extends object> = {[key in keyof T]: TokenMatcher}
const tlist = <O extends object>(o: TokenList<O>): TokenList<O> => o;
export const tokenMatchers = tlist({
    // NOTE: APP_ID could be more permissive, but absolutely must not contain commas.
    APP_ID: [FILENAME_AND_DIRECTORY_SAFE_REGEX, "App IDs must contain only ASCII letters, numbers, periods, forward slashes, and underscores."],
    BUILD_ID: [FILENAME_AND_DIRECTORY_SAFE_REGEX, "Build IDs must contain only ASCII letters, numbers, periods, forward slashes, and underscores."],
    DIALECT_ID: [BASIC_TOKEN_REGEX, "Dialect IDs must contain only ASCII letters, numbers, and underscores."],
    PAGE_ID: [BASIC_TOKEN_REGEX, "Page IDs must contain only ASCII letters, numbers, and underscores."],
    FILENAME: [FILENAME_AND_DIRECTORY_SAFE_REGEX, "Filenames must contain only ASCII letters, numbers, periods, forward slashes, and underscores."],
    LOCAL_FILENAME: [LOCAL_FILENAME_AND_DIRECTORY_SAFE_REGEX, "Local filenames must begin with a '/' and must contain only ASCII letters, numbers, periods, forward slashes, and underscores."],
    DB_ID: null,
    SUBAPP_ID: null,
    FIELD_ID: null,
    VIEW_ID: null,
    // TODO: does the directory-walking function need to use this, or can we just rely on inferred appname?
} as const);
export type LiburryTokenTypes = keyof typeof tokenMatchers;
