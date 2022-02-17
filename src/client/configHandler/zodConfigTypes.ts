// [] check lang names for displayName everywhere
// [] use async node file checks when in node mode to ensure that db files exist
// [] create some test data that should fail various cases, to make sure validation is happening
// [] create some test data that should pass various complex cases
//
// The types here are those which go through some sort of serialization - to/from YAML or JSON in particular.
import {z} from "@mrawesome/zod";
import {getRecordEntries, reflectRecord, runningInJest} from "../utils";
import {fontConfigSchema} from "./zodFontConfigTypes";
import {compileExpression as filtrexCompile} from "filtrex";

// What counts as a valid "token" - app names, dialect names, etc all will be validated against this.
// Deliberately restrictive and ASCII-centric, for simplicity of parsing/typing.
// Tokens should never be displayed to users (everything which has a token should also have a "displayName"
// if it needs one), so this only affects i18n for programmers.
const BASIC_TOKEN_REGEX: RegExp = /^[a-zA-Z0-9_/]+$/;
const FILENAME_AND_DIRECTORY_SAFE_REGEX: RegExp = /^[a-zA-Z0-9_/.]+$/;
const LOCAL_FILENAME_AND_DIRECTORY_SAFE_REGEX: RegExp = /^\/[a-zA-Z0-9_/.]+$/;

// Token Types
// NOTE: all of this type-glop is just to allow us to define the keys once while still being able to enforce the types of the values
type TokenMatcher = Readonly<[RegExp, string] | null>;
type TokenList<T extends object> = {[key in keyof T]: TokenMatcher}
const tlist = <O extends object>(o: TokenList<O>): TokenList<O> => o;
export const tokenMatchers = tlist({
    // NOTE: APP_ID could be more permissive, but absolutely must not contain commas.
    APP_ID: [FILENAME_AND_DIRECTORY_SAFE_REGEX, "App IDs must contain only ASCII letters, numbers, periods, forward slashes, and underscores."],
    BUILD_ID: [BASIC_TOKEN_REGEX, "Build IDs must contain only ASCII letters, numbers, and underscores."],
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

export const liburryCustomErrorCodes = [
    "invalid_subapp_name_in_edbs",
    "enableddbs_dict_has_no_subapps",
    "dbconfig_name_not_valid",
    "dbname_needs_config",
    "enabled_dbname_not_valid_dict",
    "invalid_view_for_db",
	"view_set_for_db_with_no_views",
    "view_not_set_for_db_in_subapp",
    "edbs_is_list_but_views_defined_dict",
    "edbs_is_list_but_views_defined_list",
    "enabled_dbname_not_valid_array",
    "enabled_dbname_not_valid_views",
    "unknown_field_in_behavior_list",
    "viewid_not_known",
    "searchablefield_not_known_field_list",
    "primarykey_known_field",
    "remote_files_https",
    "local_file_absolute_path",
    "defaultsubapp_subapps_both_or_neither",
    "defaultsubapp_defined",
    "build_defaultapp_defined",
] as const;

export type LiburryZodCustomTestingCode = (typeof liburryCustomErrorCodes)[number];

////// Utilities /////////////////////////////
function issue(ctx: z.RefinementCtx, _liburryCode: LiburryZodCustomTestingCode, message: string) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        // Add our own custom code for tests:
        // @ts-ignore
        _liburryCode,
    });
}

// NOTE: this can be made to validate keys by using .refine and Object.keys. However, everywhere where a token
// is used as a key, we're defining
function realRecord<V extends z.ZodTypeAny>(val: V) {
    return z.record(val.optional());
}

function strictObject<T extends z.ZodRawShape>(obj: T): z.ZodObject<T, "strict"> {
    return z.object(obj).strict();
}

function tokenArray(tt: LiburryTokenTypes): z.ZodArray<z.ZodString, "atleastone"> {
    return z.array(token(tt)).nonempty();
}

function anyString(): z.ZodString {
    return z.string().min(1);
}

export function token(tt: LiburryTokenTypes): z.ZodString {
    return matchToken(tt);
}

function matchToken(tt: LiburryTokenTypes): z.ZodString {
    const retStr = anyString();
    const matcher = tokenMatchers[tt];
    if (matcher === null) {
        return retStr;
    } else {
        const [regex, explanation] = matcher;
        return retStr.regex(regex, `[${tt}]: ${explanation}`);
    }
}
//////////////////////////////////////////////


const nonDefaultAppID = token("APP_ID").refine((s) => s !== "default");
const nonDefaultBuildID = token("BUILD_ID").refine((s) => s !== "default");
const defaultAppID = z.literal("default");

// TODO: use a zod schema for this.
export type AppID = z.infer<typeof nonDefaultAppID>;
export type SubAppID = string;
export type ViewID = string;
export type FieldID = string;
export type BuildID = z.infer<typeof nonDefaultBuildID>;

///////  Builds  //////////
const defaultIndexHtmlConfigSchema = strictObject({
    themeColor: anyString(),
    manifest: token("LOCAL_FILENAME"),
    favicon: token("LOCAL_FILENAME"),
    og: strictObject({
        title: anyString(),
        imageFullURL: anyString().url(),
        description: anyString(),
    }),
});

const appIDListSchema = tokenArray("APP_ID").or(z.literal("all"));
export type AppIDList = z.infer<typeof appIDListSchema>;

export const rawDefaultBuildConfigSchemaForMerge = strictObject({
    displayName: anyString(),
    apps: appIDListSchema,
    // initialApp is optional in normal build configs,
    // which default to the first app listed.
    initialApp: token("APP_ID"),
    indexHtml: defaultIndexHtmlConfigSchema,
});

export const rawDefaultBuildConfigSchema = rawDefaultBuildConfigSchemaForMerge.superRefine((defBuildConf, ctx) => {
    const {apps, initialApp} = defBuildConf;
    if (!apps.includes(initialApp)) {
        issue(ctx, "build_defaultapp_defined", `app "${initialApp}" not found in the build's apps: ${apps}`)
    }
});

export type RawDefaultBuildConfig = z.infer<typeof rawDefaultBuildConfigSchema>;

const indexHtmlConfigSchema = strictObject({
    noscript: anyString().optional(),
}).merge(defaultIndexHtmlConfigSchema.deepPartial());

const rawBuildConfigSchema = rawDefaultBuildConfigSchemaForMerge.deepPartial().merge(strictObject({
    indexHtml: indexHtmlConfigSchema.optional(),
    buildID: nonDefaultBuildID,
}));
export type RawBuildConfig = z.infer<typeof rawBuildConfigSchema>;

///////  Apps  //////////
export const rawSubAppConfigSchema = strictObject({
    displayName: anyString(),
});
export type RawSubAppConfig = z.infer<typeof rawSubAppConfigSchema>;

const subAppsSchema = realRecord(rawSubAppConfigSchema).optional();
export type SubAppsMapping = z.infer<typeof subAppsSchema>;

export const rawAppConfigSchema = strictObject({
    // [] TODO: use in index.html
    displayName: anyString().describe("The display name of the app, as it will be shown to users."),
    defaultSubApp: token("SUBAPP_ID").optional(),
    subApps: subAppsSchema,
    fonts: z.array(fontConfigSchema).optional(),
})
    .superRefine((appConfig, ctx) => {
        // NOTE: should path be added here
        if (appConfig.subApps !== undefined && appConfig.defaultSubApp !== undefined) {
            if (!Object.keys(appConfig.subApps).includes(appConfig.defaultSubApp)) {
                issue(ctx, "defaultsubapp_defined", `defaultSubApp "${appConfig.defaultSubApp}" not found in subApps: "${Object.keys(appConfig.subApps)}"`)
            }
        }

        if ((appConfig.subApps !== undefined) !== (appConfig.defaultSubApp !== undefined)) {
            issue(ctx, "defaultsubapp_subapps_both_or_neither", "If either subApps or defaultSubApp is defined, both must be defined.")
        }
    });
export type RawAppConfig = z.infer<typeof rawAppConfigSchema>;

export const rawDialectSchema = strictObject({
    displayName: anyString(),
    displayNamesInOtherDialects: realRecord(anyString()).optional(),
});
export type RawDialect = z.infer<typeof rawDialectSchema>;

export const rawDBLoadInfoSchema = strictObject({
    localCSV: token("FILENAME").optional(),
    localLunr: token("FILENAME").optional(),
})
    .superRefine((obj, ctx) => {
        getRecordEntries(obj).forEach(([key, val]) => {
            if (key.startsWith("local")) {
                if (!val.startsWith("/")) {
                    issue(ctx, "local_file_absolute_path", `(${key}): local files must be an absolute path (start with "/"). You probably want to replace "${val}" with "/${val}".`);
                }
            } else if (key.startsWith("remote")) {
                if (!val.startsWith("https://")) {
                    issue(ctx, "remote_files_https", `(${key}): remote files must begin with "https://" (current value: "${val}").`);
                }
            }
        });
    });
export type RawDBLoadInfo = z.infer<typeof rawDBLoadInfoSchema>;

export const rawMenuLinkModeSchema = z.union([
    z.literal("home"),
    z.literal("markdown"),
    z.literal("settings"),
]);
export type RawMenuLinkMode = z.infer<typeof rawMenuLinkModeSchema>;

export const fakeMTGDisplayTypeSchema = z.union([
    z.literal("fake_mtg"),
    z.literal("mtg_fake"),
]);

// TODO(high): split these into used and unused fields (for ease of knowing what's worth bothering to tag)
// TODO: .map z.literal, if that's possible while retaining types
// TODO: better name for definition/explanation (simple_definition/long_definition?)
export const rawDictionaryFieldDisplayTypeSchema = z.union([
    z.literal("base_phrase"),
    z.literal("channel_name"),
    z.literal("class"),
    z.literal("contributor"),
    z.literal("date_YYYY.MM.DD"),
    z.literal("dbname"),
    z.literal("definition"),
    z.literal("example"),
    z.literal("example_phrase"),
    z.literal("explanation"),
    z.literal("id"),
    z.literal("input"),
    z.literal("input_other"),
    z.literal("link"),
    z.literal("matched_example"),
    z.literal("measure_word"),
    z.literal("normalized"),
    z.literal("normalized_other"),
    z.literal("opposite"),
    z.literal("page_number"),
    z.literal("pos_classification"),
    z.literal("pronunciation"),
    z.literal("related_words"),
    // TODO: this seems too verbose
    z.literal("related_words_pronunciation"),
    z.literal("see_also"),
    z.literal("synonym"),
    z.literal("type"),
    z.literal("UNKNOWN"),
    z.literal("vocab"),
    z.literal("vocab_other"),
]);
export type RawDictionaryFieldDisplayType = z.infer<typeof rawDictionaryFieldDisplayTypeSchema>;

export const rawLangConfigSchema = strictObject({
    dialects: realRecord(rawDialectSchema),
});
export type RawLangConfig = z.infer<typeof rawLangConfigSchema>;

export const rawMenuLinksSchema = realRecord(
    strictObject({
        mode: rawMenuLinkModeSchema,
        displayNames: realRecord(anyString()),
    })
);
export type RawMenuLinks = z.infer<typeof rawMenuLinksSchema>;

export const rawKnownDisplayTypeEntrySchema = strictObject({
    dictionary: rawDictionaryFieldDisplayTypeSchema.optional(),
    fake_mtg: fakeMTGDisplayTypeSchema.optional(),
});
export type RawKnownDisplayTypeEntry = z.infer<typeof rawKnownDisplayTypeEntrySchema>;

export const rawFieldMetadata = strictObject({
    // TODO: give a more semantically-correct name
    type: rawKnownDisplayTypeEntrySchema.optional()
        .describe("Mapping of displayModeIDs to the type of this field in that display mode. If this is not specified, the field will never be displayed (but can still be searched)."),
    delimiter: anyString().optional()
        .describe("The delimiter, if any, splitting up tokens within the field (e.g. \"big,nasty,man\" would have the delimiter \",\")."),
    delimiterRegex: anyString().optional()
        .describe("Regular expression to find delimiters in the field's value. Takes precedence over \"delimiter\". Should not be wrapped in /. You can wrap the regex in a negative lookup to keep it from disappearing, if desired: (?=REGEX_GOES_HERE)"),
    // TODO: when this is used, ensure that the values given are actually valid dialects from lang configs
    dialect: z.union([token("DIALECT_ID"), tokenArray("DIALECT_ID")]).optional()
        .describe("[UNUSED] The human dialect (or list of dialects) of this field's data. Must be a valid DialectID (defined in lang.yml). This may be used in the future for the display of multi-language datasets."),
    lengthHint: anyString().optional()
        .describe("[UNUSED] This may be used in the future to help hint to the UI how much visual space to allocate to a field."),
    status: anyString().optional()
        .describe("[UNUSED] This may be used in the future to help hint to the UI that a field is usually empty."),
    notes: anyString().optional()
        .describe("[UNUSED] Simply a place to leave notes on the contents of a field. May be displayed to users someday."),
});
export type RawFieldMetadata = z.infer<typeof rawFieldMetadata>;

export const rawMenuConfigSchema = strictObject({
    links: rawMenuLinksSchema,
});
export type RawMenuConfig = z.infer<typeof rawMenuConfigSchema>;


const fieldsSchema = realRecord(rawFieldMetadata)
    // Reflect the name of each field as a "fieldName" so that it's accessible to us in filters.
//
    .transform((obj) => reflectRecord("fieldName", obj));

type FieldsMapping = z.infer<typeof fieldsSchema>;

// TODO: description
const fieldFilterSchema = z.object({filtrex: anyString()});
type FieldFilter = z.infer<typeof fieldFilterSchema>;

const fieldBehaviorListsPreFilterSchema = z.object({
    searchableFields: tokenArray("FIELD_ID").or(fieldFilterSchema),
    displayableFields: tokenArray("FIELD_ID").or(fieldFilterSchema).optional(),
});

const fieldBehaviorListsSchema = z.object({
    searchableFields: tokenArray("FIELD_ID"),
    displayableFields: tokenArray("FIELD_ID").nullable(),
});
type FieldBehaviorLists = z.infer<typeof fieldBehaviorListsSchema>;

function filterFields(filterOrFieldNames: FieldFilter | [string, ...string[]], fields: FieldsMapping): [string, ...string[]] {
    if ("filtrex" in filterOrFieldNames) {
        const filtrexExpression = filterOrFieldNames.filtrex;
        const f = filtrexCompile(filtrexExpression);

        const filteredResults = Object.keys(fields).filter((fieldName) => f(fields[fieldName]));
        // NOTE: this uses parse instead of safeparse. If everything in this file is added to a single class, 
        //       there can be a flag to prevent this parse from throwing during a safeparse. For now, it should
        //       be fine, since this parse should always happen at config compile time, never at runtime (since
        //       we remove the 'filter' field after filtering).
        return tokenArray("FIELD_ID").parse(filteredResults);
    } else {
        const fieldNames = filterOrFieldNames;
        return fieldNames;
    }
}

const rawDBConfigSchemaIncomplete = strictObject({
    displayName: realRecord(anyString())
        .describe("Mapping of DialectID to the DB's name in that language."),
    source: anyString().url().optional()
        .describe("Human-useful URL pointing to where the data source and its licensing information can be viewed."),
    primaryKey: token("FIELD_ID")
        .describe("Field which contains an ID unique to each entry."),
    loadInfo: rawDBLoadInfoSchema,


    //realRecord(tokenArray("FIELD_ID")))
    //.describe(`The fields which will be searched by the selected searching algorithm. Is either:
    //1) A list of searchable fields, or a filtrex filter to generate that list.
    //2) A mapping of ViewID to lists of searchable fields or filtrex filters.`
    //),

    // TODO: searchableFields and displayableFields should be a list of field names. if "filter" is given, replace it with the corresponding list of field names
    fields: fieldsSchema,
});
const rawDBConfigSchema = z.union([
    rawDBConfigSchemaIncomplete.extend({views: realRecord(fieldBehaviorListsPreFilterSchema)}),
    rawDBConfigSchemaIncomplete.merge(fieldBehaviorListsPreFilterSchema)
])
    .transform((dbConfig) => {
        // If a filter directive exists, replace it with the fields it resolves to.
        if ("views" in dbConfig) {
            const views: Record<string, FieldBehaviorLists> = {};
            for (const [viewID, fieldBehaviorListsPreFilter] of getRecordEntries(dbConfig.views)) {
                const searchableFields = filterFields(fieldBehaviorListsPreFilter.searchableFields, dbConfig.fields);
				const displayableFields = fieldBehaviorListsPreFilter.displayableFields === undefined
						? null
						: filterFields(fieldBehaviorListsPreFilter.displayableFields, dbConfig.fields);
                const filtered: FieldBehaviorLists = {searchableFields, displayableFields};
                views[viewID] = filtered;
            }
            return {...dbConfig, views};
        } else {

            const searchableFields = filterFields(dbConfig.searchableFields, dbConfig.fields);
            const displayableFields = dbConfig.displayableFields === undefined
				? null
				: filterFields(dbConfig.displayableFields, dbConfig.fields);
            const filtered: FieldBehaviorLists = {searchableFields, displayableFields};
            return {...dbConfig, ...filtered};
        }
    })
    .superRefine((dbConfig, ctx) => {
        // TODO 
        if (!(dbConfig.primaryKey in dbConfig.fields)) {
            issue(ctx, "primarykey_known_field", `primaryKey "${dbConfig.primaryKey}" is not a known field`);
        }

        if ('views' in dbConfig) {
            getRecordEntries(dbConfig.views).forEach(([viewID, fieldBehaviorLists]) => {
                let fieldBehaviorType: keyof typeof fieldBehaviorLists;
                for (fieldBehaviorType in fieldBehaviorLists) {
                    fieldBehaviorLists[fieldBehaviorType]?.forEach((givenFieldName) => {
                        if (!(givenFieldName in dbConfig.fields)) {
                            issue(ctx, "unknown_field_in_behavior_list", `field "${givenFieldName}" is not a known field in "${fieldBehaviorType}" (view: "${viewID}")`);
                        }
                    });
                }
            });
        } else {
            const {searchableFields, displayableFields} = dbConfig;
            const fieldBehaviorLists = {searchableFields, displayableFields};
            let fieldBehaviorType: keyof typeof fieldBehaviorLists;
            for (fieldBehaviorType in fieldBehaviorLists) {
                dbConfig[fieldBehaviorType]?.forEach((givenFieldName) => {
                    if (!(givenFieldName in dbConfig.fields)) {
                        issue(ctx, "unknown_field_in_behavior_list", `field "${givenFieldName}" is not a known field in "${fieldBehaviorType}"`);
                    }
                });
            }
        }
    });
export type RawDBConfig = z.infer<typeof rawDBConfigSchema>;

const dbToViewMappingSchema = realRecord(token("VIEW_ID").nullable()).refine((rec) => Object.keys(rec).length === 1);
const enabledDBsByView = z.array(token("DB_ID").or(dbToViewMappingSchema)).nonempty();

const dbListSchema = tokenArray("DB_ID")
    .describe("The authoritative list of DBIDs for this app.");
export type RawDBList = z.infer<typeof dbListSchema>;

const enabledDBsListSchema = tokenArray("DB_ID")
    .describe("List of DBIDs which are currently enabled for this app and all of its subapps. If not present, it's assumed that all DBs will be enabled.");

const enabledDBsBySubAppSchema = realRecord(enabledDBsByView);
// TODO: describe

export type RawEnabledDBsBySubApp = z.infer<typeof enabledDBsBySubAppSchema>;

const enabledDBsSchema = enabledDBsListSchema.or(enabledDBsBySubAppSchema)
export type RawEnabledDBs = z.infer<typeof enabledDBsSchema>;

const dbConfigMappingSchema = realRecord(rawDBConfigSchema);
export type RawDBConfigMapping = z.infer<typeof dbConfigMappingSchema>;

// TODO: get rid of dbList and just use dbConfigs
export const rawAllDBConfigSchema = strictObject({
    dbList: dbListSchema,
    dbConfigs: dbConfigMappingSchema,
    enabledDBs: enabledDBsSchema.optional(),
})
    // TODO: Create test data (via zod-mock?) and create unit tests
    // TODO: just use both fields and have subapp version override enableddbs
    .superRefine((allDBConfig, ctx) => {
        const {dbList, dbConfigs, enabledDBs} = allDBConfig;

		// TODO: just allow views here so you can use the same code?
        if (Array.isArray(enabledDBs)) {
            enabledDBs.forEach((dbName) => {
                if (!(dbList.includes(dbName))) {
                    issue(ctx, "enabled_dbname_not_valid_array", `"${dbName}" is not a valid DB name in enabledDBs (check "dbList")`);
                }
                if ("views" in (dbConfigs[dbName] ?? {})) {
                    issue(ctx, "edbs_is_list_but_views_defined_list", `"views" are defined for db "${dbName}", but "enabledDBs" is a list. Views are intended for use with subApps.`);
                }
            });
		} else if (enabledDBs === undefined) {
		} else {
			getRecordEntries(enabledDBs).forEach(([subAppID, dbsForSubapp]) => {
				// For the valid db name in subapp check below, either infer the enabled db list, or use the explicitly defined one

				dbsForSubapp.forEach((dbNameOrDBToView) => {
					if (typeof dbNameOrDBToView === "string") {
						const dbName = dbNameOrDBToView;
						if (!(dbList.includes(dbName))) {
							issue(ctx, "enabled_dbname_not_valid_views", `"${dbName}" is not a valid DB name in enabledDBs for subapp "${subAppID}" (check "dbList")`);
						}
					} else {
						const dbToView = dbNameOrDBToView;
						const [dbName, viewID] = Object.entries(dbToView)[0];
						// We check for dbID validity below so we don't need to bother checking again here
						if (!(dbList.includes(dbName))) {
							issue(ctx, "enabled_dbname_not_valid_views", `"${dbName}" is not a valid DB name in enabledDBs for subapp "${subAppID}" (check "dbList")`);
						}
						const dbConfig = dbConfigs[dbName];
						if (dbConfig !== undefined && "views" in dbConfig) {
							const viewsForDB = dbConfig.views;
							if (viewID === null || viewID === undefined) {
								issue(ctx, "view_not_set_for_db_in_subapp", `view is not set for db "${dbName}" for subApp "${subAppID}", but that db has views defined: "${viewsForDB}".`);
							} else {
								if (!(viewID in viewsForDB)) {
									issue(ctx, "invalid_view_for_db", `"${viewID}" is not a valid view for db "${dbName}" for subApp "${subAppID}".`);
								}
							}
						} else {
							if (typeof viewID === "string") {
								issue(ctx, "view_set_for_db_with_no_views", `view is set for db "${dbName}" for subApp "${subAppID}", but that db does not have views defined.`);
							} 
						}
					}
				});
			});
		}

        dbList.forEach((dbName) => {
            if (!(dbName in dbConfigs)) {
                issue(ctx, "dbname_needs_config", `"${dbName}" must have a config defined in "dbConfigs"`);
            }
        });

        getRecordEntries(allDBConfig.dbConfigs).forEach(([dbName, _dbConfig]) => {
            if (!(dbList.includes(dbName))) {
                issue(ctx, "dbconfig_name_not_valid", `"${dbName}" is not a valid DB name in dbConfigs (check "dbList")`);
            }
        });
    }).transform((adbc) => {
        // If enabledDBs is not given, use dbList
        let edbs = adbc.enabledDBs ?? adbc.dbList;
        const withFilledInEnabledDBs = {
            ...adbc,
            enabledDBs: edbs,
        };
        return withFilledInEnabledDBs;
    });

export type RawAllDBConfig = z.infer<typeof rawAllDBConfigSchema>;

const appConfigSchema = strictObject({
    configType: z.literal("appConfig"),
    config: rawAppConfigSchema,
});

const dbConfigSchema = strictObject({
    configType: z.literal("dbConfig"),
    config: rawAllDBConfigSchema,
});

const langConfigSchema = strictObject({
    configType: z.literal("langConfig"),
    config: rawLangConfigSchema,
});

const menuConfigSchema = strictObject({
    configType: z.literal("menuConfig"),
    config: rawMenuConfigSchema,
});

const defaultBuildConfigSchema = strictObject({
    configType: z.literal("defaultBuildConfig"),
    config: rawDefaultBuildConfigSchema,
});

// Which configs must/can be present for a given app.
const rawAppLoadedAllConfigSchema = strictObject({
    appConfig: appConfigSchema,
    dbConfig: dbConfigSchema,
    langConfig: langConfigSchema.optional(),
    menuConfig: menuConfigSchema.optional(),
});

// "default" has different requirements for which configs must be present.
const rawDefaultLoadedAllConfigSchema = strictObject({
    langConfig: langConfigSchema,
    menuConfig: menuConfigSchema,
    defaultBuildConfig: defaultBuildConfigSchema,
});

const loadedAllConfigSchema = rawDefaultLoadedAllConfigSchema.merge(rawAppLoadedAllConfigSchema).required();

type LoadedAllConfig = z.infer<typeof loadedAllConfigSchema>;

export type LoadedConfig = LoadedAllConfig[keyof LoadedAllConfig];
export type KnownConfigTypes = LoadedConfig["configType"];

const mdPageSchema = strictObject({
    pageType: z.literal("markdown"),
    pageID: token("PAGE_ID"),
    mdText: anyString(),
    dialect: token("DIALECT_ID"),
});

const htmlPageSchema = strictObject({
    pageType: z.literal("HTML_UNUSED"),
    pageID: token("PAGE_ID"),
    htmlText: anyString(),
    dialect: token("DIALECT_ID"),
});

const loadedPageSchema = z.union([mdPageSchema, htmlPageSchema]);
export type LoadedPage = z.infer<typeof loadedPageSchema>;

export type PageType = LoadedPage["pageType"];
export type PageID = LoadedPage["pageID"];

const loadedKnownFileSchema = z.union([
    strictObject({
        type: z.literal("config"),
    }).and(loadedAllConfigSchema),
    strictObject({
        type: z.literal("page"),
    }).and(loadedPageSchema),

]);
export type LoadedKnownFile = z.infer<typeof loadedKnownFileSchema>;

const allPagesSchema = realRecord(loadedPageSchema);

const defaultAllConfigSchema = rawDefaultLoadedAllConfigSchema;
const appAllConfigSchema = rawAppLoadedAllConfigSchema.superRefine((appAllConfigs, ctx) => {
    const appConfig = appAllConfigs.appConfig.config;
    const allDBConfigs = appAllConfigs.dbConfig.config;

    const {enabledDBs} = allDBConfigs;

    if (appConfig.subApps === undefined) {
        if (!Array.isArray(enabledDBs)) {
            issue(ctx, "enableddbs_dict_has_no_subapps", `enabledDBs is a dict, but there are no subApps defined for this app.`);
        }
    } else {
        const subAppNames = Object.keys(appConfig.subApps);

        if (!Array.isArray(enabledDBs)) {
            subAppNames.forEach((subAppID) => {
                if (!(subAppID in enabledDBs)) {
                    if (!runningInJest()) {
                        console.info(`subApp "${subAppID}" does not have an entry in "enabledDBs", all DBs will be assumed enabled there.`);
                    }
                }
            });

            Object.keys(enabledDBs).forEach((subAppID) => {
                if (!subAppNames.includes(subAppID)) {
                    issue(ctx, "invalid_subapp_name_in_edbs", `invalid subApp name in "enabledDBs": "${subAppID}"`);
                }
            });
        }
    }
});

export const appTopLevelConfigurationSchema = strictObject({
    appID: nonDefaultAppID,
    pages: allPagesSchema,
    configs: appAllConfigSchema,
});
export type AppTopLevelConfiguration = z.infer<typeof appTopLevelConfigurationSchema>;

export const defaultTopLevelConfigurationSchema = strictObject({
    appID: defaultAppID,
    pages: allPagesSchema,
    configs: defaultAllConfigSchema,
    build: defaultBuildConfigSchema,
});

export type DefaultTopLevelConfiguration = z.infer<typeof defaultTopLevelConfigurationSchema>;

const allAppsSchema = z.object({default: z.undefined()})
    .catchall(appTopLevelConfigurationSchema.optional())
    // [] clear this up?
    .refine(
        (rec) => Object.keys(rec).length > 0,
        "at least one non-default app configuration must be defined"
    );

export const returnedFinalConfigSchema = strictObject({
    default: defaultTopLevelConfigurationSchema,
    appConfigs: allAppsSchema,
    buildConfig: rawBuildConfigSchema.optional(),

    overrides: z.object({
        initialAppOverride: token("APP_ID").optional(),
        appIDsOverride: appIDListSchema.optional(),
    }).optional(),
});

// TODO: make a wrapper class to make operations on this easier once it's loaded
export type ReturnedFinalConfig = z.infer<typeof returnedFinalConfigSchema>;

const intermediateConfig = returnedFinalConfigSchema.deepPartial();
export type IntermediateConfig = z.infer<typeof intermediateConfig>;
