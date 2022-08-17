// [] check lang names for displayName everywhere
// [] use async node file checks when in node mode to ensure that db files exist
// [] create some test data that should fail various cases, to make sure validation is happening
// [] create some test data that should pass various complex cases
// [] at the risk of introducing cyclical dependencies, you can ensure dialect etc are valid at type time by generating them in compileYamlLib - just need to be careful about zod relying on the contents of those files in its initial run
//
// The types here are those which go through some sort of serialization - to/from YAML or JSON in particular.
import {z} from "@mrawesome/zod";
import {getRecordEntries, noop, reflectRecord, runningInJest} from "../utils";
import {rawFontConfigSchema} from "./zodFontConfigTypes";
import {compileExpression as filtrexCompile} from "filtrex";
import {anyString, realRecord, token, strictObject, tokenArray} from "./zodUtils";
import {rawLangConfigSchema} from "./zodLangConfigTypes";
import {issue} from "./zodIssue";


export const DEFAULT_APP_ID = "default" as const;
const validated_DefaultAppID = z.literal(DEFAULT_APP_ID);

export const ALL_APPS_OVERRIDE = "all" as const;

const validated_NonDefaultAppID = token("APP_ID").refine((s) => s !== DEFAULT_APP_ID && s !== ALL_APPS_OVERRIDE);
const validated_NonDefaultBuildID = token("BUILD_ID").refine((s) => s !== DEFAULT_APP_ID && s !== ALL_APPS_OVERRIDE);

const validated_SubAppID = token("SUBAPP_ID");
const validated_FieldID = token("FIELD_ID");
const validated_ViewID = token("VIEW_ID");
const validated_DBIdentifier = token("DB_ID");

export type DefaultAppID = z.infer<typeof validated_DefaultAppID>;
export type AppID = z.infer<typeof validated_NonDefaultAppID>;
export type BuildID = z.infer<typeof validated_NonDefaultBuildID>;
export type SubAppID = z.infer<typeof validated_SubAppID>;
export type ViewID = z.infer<typeof validated_ViewID>;
export type FieldID = z.infer<typeof validated_FieldID>;
export type DBIdentifier = z.infer<typeof validated_DBIdentifier>;

///////  Builds  //////////
const defaultIndexHtmlConfigSchema = strictObject({
    themeColor: anyString(),
    manifest: token("LOCAL_FILENAME"),
    favicon: token("LOCAL_FILENAME"),
    og: strictObject({
        title: anyString(),
        imageFullURL: anyString().url().describe("The image which should show up in OpenGraph shares for this app. NOTE: this _must_ be an externally-addressable URL, starting with http(s). Relative/absolute URLs will not work."),
        description: anyString(),
    }),
});

const appIDListSchema = tokenArray("APP_ID");
export type AppIDList = z.infer<typeof appIDListSchema>;
const appIDListOrAllSchema = appIDListSchema.or(z.literal("all"));
export type AppIDListOrAll = z.infer<typeof appIDListOrAllSchema>;

export const rawDefaultBuildConfigSchemaForMerge = strictObject({
    displayName: anyString(),
    apps: appIDListOrAllSchema,
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
    buildID: validated_NonDefaultBuildID,
}));
export type RawBuildConfig = z.infer<typeof rawBuildConfigSchema>;

///////  Apps  //////////
export const rawSubAppConfigSchema = strictObject({
    displayName: anyString(),
});
export type RawSubAppConfig = z.infer<typeof rawSubAppConfigSchema>;

const subAppsSchema = realRecord(token("SUBAPP_ID"), rawSubAppConfigSchema).optional();
export type SubAppsMapping = z.infer<typeof subAppsSchema>;

export const rawAppConfigSchema = strictObject({
    displayName: anyString().describe("The display name of the app, as it will be shown to users."),
    defaultSubApp: token("SUBAPP_ID").optional(),
    subApps: subAppsSchema,

    fontGroups: z.array(token("FONT_GROUP_ID")).optional(),
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
    z.literal("long_definition"),
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

export const rawMenuLinksSchema = realRecord(
    token("PAGE_ID"),
    strictObject({
        mode: rawMenuLinkModeSchema,
        displayNames: realRecord(null, anyString()),
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
        .describe("The human dialect (or list of dialects) of this field's data. Must be a valid DialectID (defined in lang.yml). This may be used in the future for the display of multi-language datasets."),
    lengthHint: anyString().optional()
        .describe("[UNUSED] This may be used in the future to help hint to the UI how much visual space to allocate to a field."),
    status: anyString().optional()
        .describe("[UNUSED] This may be used in the future to help hint to the UI that a field is usually empty."),
    notes: anyString().optional()
        .describe("[UNUSED] Simply a place to leave notes on the contents of a field. May be displayed to users someday."),
    fieldName: token("FIELD_ID").optional()
        .describe("[AUTO] This field will be automatically populated/overwritten. It's simply the name of this field, for use in filtrex filters.")
});
export type RawFieldMetadata = z.infer<typeof rawFieldMetadata>;

export const rawMenuConfigSchema = strictObject({
    links: rawMenuLinksSchema,
});
export type RawMenuConfig = z.infer<typeof rawMenuConfigSchema>;

const fieldsSchema = realRecord(token("FIELD_ID"), rawFieldMetadata)
    // Reflect the name of each field as a "fieldName" so that it's accessible to us in filters.
    //
    .transform((fields) => reflectRecord("fieldName", fields))
    .refine(
        (fields) => Object.keys(fields).length > 0,
        "at least one field must be defined"
    );

type FieldsMapping = z.infer<typeof fieldsSchema>;

// TODO: description of what a filtrex filter is and how to use it (with link/example)
const fieldFilterSchema = strictObject({filtrex: anyString()});
type FieldFilter = z.infer<typeof fieldFilterSchema>;

const fieldBehaviorListsPreFilterSchema = strictObject({
    searchableFields: tokenArray("FIELD_ID").or(fieldFilterSchema),
    displayableFields: tokenArray("FIELD_ID").or(fieldFilterSchema).optional(),
});

const fieldBehaviorListsSchema = strictObject({
    searchableFields: tokenArray("FIELD_ID"),
    displayableFields: tokenArray("FIELD_ID"),
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

// TODO: "DynamicallyGeneratedPage" -> from code or here, to a page stored on pagehandler or something. needs to respect the user's given lang
// for *any* page, using ${TOK_NAME} will load TOK_NAME through the language-aware token-loading system (user-selected lang -> eng_us -> first_defined)
// at zod-time, do a check that all referenced tokens are actually present in the system
const rawDBConfigSchemaIncomplete = strictObject({
    displayNames: realRecord(token("DIALECT_ID"), anyString())
        .describe("Mapping of DialectID to the DB's name in that language."),
    source: anyString().url()
        .describe("Human-useful URL pointing to where the data source and its licensing information can be viewed."),
    license: anyString()
        .describe("Information about which license (Creative Commons, Public Domain, Open Source) the DB is provided under."),
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
    rawDBConfigSchemaIncomplete.merge(strictObject({views: realRecord(token("VIEW_ID"), fieldBehaviorListsPreFilterSchema)})),
    rawDBConfigSchemaIncomplete.merge(fieldBehaviorListsPreFilterSchema)
])
    .transform((dbConfig) => {
        // If a filter directive exists, replace it with the fields it resolves to.
        if ("views" in dbConfig) {
            const views: Record<string, FieldBehaviorLists> = {};
            for (const [viewID, fieldBehaviorListsPreFilter] of getRecordEntries(dbConfig.views)) {
                const searchableFields = filterFields(fieldBehaviorListsPreFilter.searchableFields, dbConfig.fields);
                const displayableFields = fieldBehaviorListsPreFilter.displayableFields === undefined
                    ? Object.keys(dbConfig.fields) as [FieldID, ...FieldID[]]
                    : filterFields(fieldBehaviorListsPreFilter.displayableFields, dbConfig.fields);
                const filtered: FieldBehaviorLists = {searchableFields, displayableFields};
                views[viewID] = filtered;
            }
            return {...dbConfig, views};
        } else {

            const searchableFields = filterFields(dbConfig.searchableFields, dbConfig.fields);
            const displayableFields = dbConfig.displayableFields === undefined
                ? Object.keys(dbConfig.fields) as [FieldID, ...FieldID[]]
                : filterFields(dbConfig.displayableFields, dbConfig.fields);
            const filtered: FieldBehaviorLists = {searchableFields, displayableFields};
            return {...dbConfig, ...filtered};
        }
    })
    .superRefine((dbConfig, ctx) => {
        if (!(dbConfig.primaryKey in dbConfig.fields)) {
            issue(ctx, "primarykey_known_field", `primaryKey "${dbConfig.primaryKey}" is not a known field`);
        }

        // TODO: dedupe logic here
        if ('views' in dbConfig) {
            getRecordEntries(dbConfig.views).forEach(([viewID, fieldBehaviorLists]) => {
                Object.keys(fieldBehaviorLists).forEach((k) => {
                    const fieldBehaviorType = k as keyof typeof fieldBehaviorLists; // necessary to avoid "no-loop-func"
                    fieldBehaviorLists[fieldBehaviorType]?.forEach((givenFieldName) => {
                        if (!(givenFieldName in dbConfig.fields)) {
                            issue(ctx, "unknown_field_in_behavior_list", `field "${givenFieldName}" is not a known field in "${fieldBehaviorType}" (view: "${viewID}")`);
                        }
                    });
                });
            });
        } else {
            const {searchableFields, displayableFields} = dbConfig;
            const fieldBehaviorLists = {searchableFields, displayableFields};
            Object.keys(fieldBehaviorLists).forEach((k) => {
                const fieldBehaviorType = k as keyof typeof fieldBehaviorLists; // necessary to avoid "no-loop-func"
                dbConfig[fieldBehaviorType]?.forEach((givenFieldName) => {
                    if (!(givenFieldName in dbConfig.fields)) {
                        issue(ctx, "unknown_field_in_behavior_list", `field "${givenFieldName}" is not a known field in "${fieldBehaviorType}"`);
                    }
                });
            });
        }
    });
export type RawDBConfig = z.infer<typeof rawDBConfigSchema>;

const dbToViewMappingSchema = realRecord(token("DB_ID"), token("VIEW_ID").nullable()).refine((rec) => Object.keys(rec).length === 1);
const enabledDBsByView = z.array(token("DB_ID").or(dbToViewMappingSchema)).nonempty();

const dbListSchema = tokenArray("DB_ID")
    .describe("The authoritative list of DBIDs for this app.");
export type RawDBList = z.infer<typeof dbListSchema>;

const enabledDBsListSchema = tokenArray("DB_ID")
    .describe("List of DBIDs which are currently enabled for this app and all of its subapps. If not present, it's assumed that all DBs will be enabled.");

const enabledDBsBySubAppSchema = realRecord(token("SUBAPP_ID"), enabledDBsByView);
// TODO: describe

export type RawEnabledDBsBySubApp = z.infer<typeof enabledDBsBySubAppSchema>;

const enabledDBsSchema = enabledDBsListSchema.or(enabledDBsBySubAppSchema)
export type RawEnabledDBs = z.infer<typeof enabledDBsSchema>;

const dbConfigMappingSchema = realRecord(token("DB_ID"), rawDBConfigSchema);
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
                // TODO: get rid of dblist, just use dbConfigs?
                if (!(dbList.includes(dbName))) {
                    issue(ctx, "enabled_dbname_not_valid_array", `"${dbName}" is not a valid DB name in enabledDBs (check "dbList")`);
                }
                const dbConfig = dbConfigs[dbName];
                if (dbConfig !== undefined && "views" in dbConfig) {
                    // Type discovery
                    noop(dbConfig.views);
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
        const edbs = adbc.enabledDBs ?? adbc.dbList;
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

const fontConfigSchema = strictObject({
    configType: z.literal("fontConfig"),
    config: rawFontConfigSchema,
});

const defaultBuildConfigSchema = strictObject({
    configType: z.literal("defaultBuildConfig"),
    config: rawDefaultBuildConfigSchema,
});

// Which configs must/can be present for a given app.
const rawAppLoadedAllConfigSchema = strictObject({
    appConfig: appConfigSchema,
    dbConfig: dbConfigSchema,
    menuConfig: menuConfigSchema.optional(),
});

// "default" has different requirements for which configs must be present.
const rawDefaultLoadedAllConfigSchemaForMerge = strictObject({
    langConfig: langConfigSchema,
    menuConfig: menuConfigSchema,
    defaultBuildConfig: defaultBuildConfigSchema,
    fontConfig: fontConfigSchema,
});

const rawDefaultLoadedAllConfigSchema = rawDefaultLoadedAllConfigSchemaForMerge.superRefine((defaultConfig, ctx) => {
    const {langConfig, fontConfig} = defaultConfig;

    const knownFontGroups = new Set(Object.keys(fontConfig.config.fontGroups));

    getRecordEntries(langConfig.config.dialects).forEach(([dialectID, dialectConfig]) => {
        const {requiredFontGroups} = dialectConfig;
        if (requiredFontGroups !== undefined) {
            requiredFontGroups.forEach((requiredFontGroup) => {
                if (!knownFontGroups.has(requiredFontGroup)) {
                    issue(ctx, "invalid_font_group_in_dialect_config", `Unknown font group "${requiredFontGroup}" in config for dialect "${dialectID}"`);
                }
            });
        }
    });
});

const loadedAllConfigSchema = rawDefaultLoadedAllConfigSchemaForMerge.merge(rawAppLoadedAllConfigSchema).required();
type LoadedAllConfig = z.infer<typeof loadedAllConfigSchema>;

export type LoadedConfig = LoadedAllConfig[keyof LoadedAllConfig];
export type KnownConfigTypes = LoadedConfig["configType"];

const mdPageSchema = strictObject({
    pageType: z.literal("markdown"),
    pageID: token("PAGE_ID"),
    appID: token("APP_ID"),
    mdText: anyString(),
    dialect: token("DIALECT_ID"),
});
export type MarkdownPage = z.infer<typeof mdPageSchema>;

const htmlPageSchema = strictObject({
    pageType: z.literal("HTML_UNUSED"),
    pageID: token("PAGE_ID"),
    appID: token("APP_ID"),
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

const allPagesSchema = z.array(loadedPageSchema);

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
    appID: validated_NonDefaultAppID,
    pages: allPagesSchema,
    configs: appAllConfigSchema,
});
export type AppTopLevelConfiguration = z.infer<typeof appTopLevelConfigurationSchema>;

export const defaultTopLevelConfigurationSchema = strictObject({
    appID: validated_DefaultAppID,
    pages: allPagesSchema,
    configs: defaultAllConfigSchema,
    build: defaultBuildConfigSchema,
});

export type DefaultTopLevelConfiguration = z.infer<typeof defaultTopLevelConfigurationSchema>;

const allAppsSchema = z.object({default: z.undefined()})
    .catchall(appTopLevelConfigurationSchema.optional())
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
        appIDsOverride: appIDListOrAllSchema.optional(),
    }).optional(),
}).superRefine((rfc, ctx) => {
    const {fontConfig} = rfc.default.configs;
    const {appConfigs} = rfc;

    const knownFontGroups = new Set(Object.keys(fontConfig.config.fontGroups));

    getRecordEntries(appConfigs).forEach(([appID, appConfig]) => {
        const requiredFontGroups = appConfig.configs.appConfig.config.fontGroups;
        if (requiredFontGroups !== undefined) {
            requiredFontGroups.forEach((requiredFontGroup) => {
                if (!knownFontGroups.has(requiredFontGroup)) {
                    issue(ctx, "invalid_font_group_in_app_config", `Unknown font group "${requiredFontGroup}" in config for app "${appID}"`);
                }
            });
        }
    });
});

// TODO: make a wrapper class to make operations on this easier once it's loaded
export type ReturnedFinalConfig = z.infer<typeof returnedFinalConfigSchema>;
