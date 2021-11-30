// [] check lang names for displayName everywhere
// [] use async node file checks when in node mode to ensure that db files exist
// [] create some test data that should fail various cases, to make sure validation is happening
// [] create some test data that should pass various complex cases
//
// The types here are those which go through some sort of serialization - to/from YAML or JSON in particular.
import {z} from "zod";
import {DBIdentifier} from "../types/config";
import {getRecordEntries, getRecordValues} from "../utils";

////// Utilities /////////////////////////////
function issue(ctx: z.RefinementCtx, message: string) {
    ctx.addIssue({code: z.ZodIssueCode.custom, message});
}

function realRecord<V extends z.ZodTypeAny>(val: V) {
    return z.record(val.optional());
}

function strictObject<T extends z.ZodRawShape>(obj: T): z.ZodObject<T, "strict"> {
    return z.object(obj).strict();
}

function nonEmptyStringArray() {
    return z.array(z.string().min(1)).nonempty();
}
//////////////////////////////////////////////


const nonDefaultAppID = z.string().min(1).refine((s) => s !== "default");
const defaultAppID = z.literal("default");
// TODO: use a zod schema for this.
export type AppID = z.infer<typeof nonDefaultAppID>;
export type SubAppID = string;
export type ViewID = string;
export type FieldID = string;

export const rawSubAppConfigSchema = strictObject({
    displayName: z.string().min(1),
});

const subAppsSchema = realRecord(rawSubAppConfigSchema).optional();
export type SubAppsMapping = z.infer<typeof subAppsSchema>;

export const rawAppConfigSchema = strictObject({
    // [] TODO: use in index.html
    displayName: z.string().min(1).describe("The display name of the app, as it will be shown to users."),
    defaultSubApp: z.string().min(1).optional(),
    subApps: subAppsSchema,
})
    .superRefine((appConfig, ctx) => {
        // NOTE: should path be added here
        if (appConfig.subApps !== undefined && appConfig.defaultSubApp !== undefined) {
            if (!Object.keys(appConfig.subApps).includes(appConfig.defaultSubApp)) {
                issue(ctx, `defaultSubApp "${appConfig.defaultSubApp}" not found in subApps: "${Object.keys(appConfig.subApps)}"`)
            }
        }

        if ((appConfig.subApps !== undefined) !== (appConfig.defaultSubApp !== undefined)) {
            issue(ctx, "If either subApps or defaultSubApp is defined, both must be defined.")
        }
    });
export type RawAppConfig = z.infer<typeof rawAppConfigSchema>;

export const rawDialectSchema = strictObject({
    displayName: z.string().min(1),
    namesForOtherDialects: realRecord(z.string().min(1)).optional(),
});
export type RawDialect = z.infer<typeof rawDialectSchema>;

export const rawDBLoadInfoSchema = strictObject({
    localCSV: z.string().min(1).optional(),
    localLunr: z.string().min(1).optional(),
})
    .superRefine((obj, ctx) => {
        getRecordEntries(obj).forEach(([key, val]) => {
            if (key.startsWith("local")) {
                if (!val.startsWith("/")) {
                    issue(ctx, `(${key}): local files must be an absolute path (start with "/"). You probably want to replace "${val}" with "/${val}".`);
                }
            } else if (key.startsWith("remote")) {
                if (!val.startsWith("https://")) {
                    issue(ctx, `(${key}): remote files must begin with "https://" (current value: "${val}").`);
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
        displayNames: realRecord(z.string().min(1)),
    })
);
export type RawMenuLinks = z.infer<typeof rawMenuLinksSchema>;

export const rawKnownDisplayTypeEntrySchema = strictObject({
    dictionary: rawDictionaryFieldDisplayTypeSchema.optional(),
    fake_mtg: fakeMTGDisplayTypeSchema.optional(),
});
export type RawKnownDisplayTypeEntry = z.infer<typeof rawKnownDisplayTypeEntrySchema>;

export const rawAllowedFieldClassifierTagsSchema = strictObject({
    type: rawKnownDisplayTypeEntrySchema.optional()
        .describe("Mapping of displayModeIDs to the type of this field in that display mode. If this is not specified, the field will never be displayed (but can still be searched)."),
    delimiter: z.string().min(1).optional()
        .describe("The delimiter, if any, splitting up tokens within the field (e.g. \"big,nasty,man\" would have the delimiter \",\")."),
    delimiterRegex: z.string().min(1).optional()
        .describe("Regular expression to find delimiters in the field's value. Takes precedence over \"delimiter\". You can wrap the regex in a negative lookup to keep it from disappearing, if desired: (?=REGEX_GOES_HERE)"),
    dialect: z.union([z.string().min(1), nonEmptyStringArray()]).optional()
        .describe("[UNUSED] The human dialect (or list of dialects) of this field's data. Must be a valid DialectID (defined in lang.yml). This may be used in the future for the display of multi-language datasets."),
    lengthHint: z.string().min(1).optional()
        .describe("[UNUSED] This may be used in the future to help hint to the UI how much visual space to allocate to a field."),
    status: z.string().min(1).optional()
        .describe("[UNUSED] This may be used in the future to help hint to the UI that a field is usually empty."),
    notes: z.string().min(1).optional()
        .describe("[UNUSED] Simply a place to leave notes on the contents of a field. May be displayed to users someday."),
});
export type RawAllowedFieldClassifierTags = z.infer<typeof rawAllowedFieldClassifierTagsSchema>;

export const rawMenuConfigSchema = strictObject({
    links: rawMenuLinksSchema,
});
export type RawMenuConfig = z.infer<typeof rawMenuConfigSchema>;

const fieldsSchema = realRecord(rawAllowedFieldClassifierTagsSchema);
const rawDBConfigSchema = strictObject({
    displayName: realRecord(z.string().min(1))
        .describe("Mapping of DialectID to the DB's name in that language."),
    source: z.string().min(1).url().optional()
        .describe("Human-useful URL pointing to where the data source and its licensing information can be viewed."),
    primaryKey: z.string().min(1)
        .describe("Field which contains an ID unique to each entry."),
    loadInfo: rawDBLoadInfoSchema,

    searchableFields: nonEmptyStringArray().or(realRecord(nonEmptyStringArray()))
        .describe(`The fields which will be searched by the selected searching algorithm. Is either:
                  1) A list of searchable fields.
                  2) A mapping of ViewID to lists of searchable fields.`
        ),

    views: nonEmptyStringArray().optional()
        .describe("List of ViewIDs defined for this data source. Views are a way to specify which fields should be searched or displayed for a particular data source."),

    fields: fieldsSchema,
})
.superRefine((obj, ctx) => {
    if (obj.primaryKey.length < 0) {
        issue(ctx, "primaryKey must be defined");
    }
    if (!(obj.primaryKey in obj.fields)) {
        issue(ctx, `primaryKey "${obj.primaryKey}" is not a known field`);
    }
    const displayNames = getRecordValues(obj.displayName);
    if (displayNames.length < 1) {
        issue(ctx, "at least one displayName must be defined");
    }

    if (Array.isArray(obj.searchableFields)) {
        obj.searchableFields.forEach((givenFieldName) => {
            if (!(givenFieldName in obj.fields)) {
                issue(ctx, `searchableField "${givenFieldName}" is not a known field`);
            }
        });
    } else {
        getRecordEntries(obj.searchableFields).forEach(([view, givenFieldNames]) => {
            if (!obj.views?.includes(view)) {
                issue(ctx, `given view name "${view}" is not a known view (db: "${obj.displayName}")`);
            }
            givenFieldNames.forEach((givenFieldName) => {
                if (!(givenFieldName in obj.fields)) {
                    issue(ctx, `searchableField "${givenFieldName}" is not a known field (view: "${view}"`);
                }
            });
        });
    }
});
export type RawDBConfig = z.infer<typeof rawDBConfigSchema>;

const dbToViewMappingSchema = realRecord(z.string().min(1));
type DBToViewMapping = z.infer<typeof dbToViewMappingSchema>;
const enabledDBsOrDBToViewMappingSchema = nonEmptyStringArray().or(dbToViewMappingSchema);

const dbListSchema = nonEmptyStringArray()
    .describe("The authoritative list of DBIDs for this app.");
export type RawDBList = z.infer<typeof dbListSchema>;

const enabledDBsListSchema = nonEmptyStringArray()
    .describe("List of DBIDs which are currently enabled for this app and all of its subapps. If not present, it's assumed that all DBs will be enabled.");
const enabledDBsBySubAppSchema = realRecord(enabledDBsOrDBToViewMappingSchema)
    .describe(`A more advanced configuration which contains a mapping of SubAppID to either: \
    1) A list of DBIDs enabled for that subapp. \
    2) A mapping of DBIDs to which ViewID should be used for that DB in this subapp.`);
export type RawEnabledDBsBySubApp = z.infer<typeof enabledDBsBySubAppSchema>;

const enabledDBsSchema = enabledDBsListSchema.or(enabledDBsBySubAppSchema)
export type RawEnabledDBs = z.infer<typeof enabledDBsSchema>;

const dbConfigMappingSchema = realRecord(rawDBConfigSchema);
export type RawDBConfigMapping = z.infer<typeof dbConfigMappingSchema>;

export const rawAllDBConfigSchema = strictObject({
    dbList: dbListSchema,
    dbConfigs: dbConfigMappingSchema,
    enabledDBs: enabledDBsSchema.optional(),
})
// TODO: Create test data (via zod-mock?) and create unit tests
// TODO: just use both fields and have subapp version override enableddbs
// TODO: validate subapp names
.superRefine((allDBConfig, ctx) => {
    const {dbList, dbConfigs, enabledDBs} = allDBConfig;

    if (Array.isArray(enabledDBs)) {
        enabledDBs.forEach((dbName) => {
            if (!(dbList.includes(dbName))) {
                issue(ctx, `"${dbName}" is not a valid DB name in enabledDBs (check "dbList")`);
            }
        });
    } else {
        getRecordEntries(enabledDBs ?? {}).forEach(([subAppName, enabledDBListOrDBToViewMapping]) => {
            let enabledDBList: DBIdentifier[];
            if (Array.isArray(enabledDBListOrDBToViewMapping)) {
                enabledDBList = enabledDBListOrDBToViewMapping as DBIdentifier[];
            } else {
                enabledDBList = Object.keys(enabledDBListOrDBToViewMapping);

                const dbToViewPairs = getRecordEntries(enabledDBListOrDBToViewMapping as DBToViewMapping);

                dbToViewPairs.forEach(([dbID, viewID]) => {
                    // We check for dbID validity below so we don't need to bother checking again here
                    const viewsForDB = dbConfigs[dbID]?.views;
                    if (!viewsForDB?.includes(viewID)) {
                        issue(ctx, `"${viewID}" is not a valid view for db "${dbID}" (or "${dbID}" is invalid).`);
                    }
                });
            }
            enabledDBList.forEach((dbName) => {
                if (!(dbList.includes(dbName))) {
                    issue(ctx, `"${dbName}" is not a valid DB name in enabledDBsBySubApp for "${subAppName}" (check "dbList")`);
                }
            });
        });
    }

    dbList.forEach((dbName) => {
        if (!(dbName in dbConfigs)) {
            issue(ctx, `"${dbName}" must have a config defined in "dbConfigs"`);
        }
    });


    getRecordEntries(allDBConfig.dbConfigs).forEach(([dbName, _dbConfig]) => {
        if (!(dbList.includes(dbName))) {
            issue(ctx, `"${dbName}" is not a valid DB name in dbConfigs (check "dbList")`);
        }
    });
}).transform((adbc) => {
    // If enabledDBs is not given, use dbList
    let edbs = adbc.enabledDBs ?? adbc.dbList;
    const withFilledInEnabledDBs =  {
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
});

const loadedAllConfigSchema = rawDefaultLoadedAllConfigSchema.merge(rawAppLoadedAllConfigSchema).required();

type LoadedAllConfig = z.infer<typeof loadedAllConfigSchema>;

export type LoadedConfig = LoadedAllConfig[keyof LoadedAllConfig];
export type KnownConfigTypes = LoadedConfig["configType"];

const mdPageSchema = strictObject({
    pageType: z.literal("markdown"),
    pageID: z.string().min(1),
    mdText: z.string().min(1),
    lang: z.string().min(1),
});

const htmlPageSchema = strictObject({
    pageType: z.literal("HTML_UNUSED"),
    pageID: z.string().min(1),
    htmlText: z.string().min(1),
    lang: z.string().min(1),
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


    if (appConfig.subApps !== undefined) {
        const subAppNames = Object.keys(appConfig.subApps);

        if (!Array.isArray(enabledDBs)) {
            subAppNames.forEach((subAppID) => {
                if (!(subAppID in enabledDBs)) {
                    console.log(`subApp "${subAppID}" does not have an entry in "enabledDBs", all DBs will be assumed enabled there.`);
                }
            });

            Object.keys(enabledDBs).forEach((subAppID) => {
                if (!subAppNames.includes(subAppID)) {
                    issue(ctx, `invalid subApp name in "enabledDBsForSubApp": "${subAppID}"`);
                }
            });
        }
    } else {
        if (!Array.isArray(enabledDBs)) {
            issue(ctx, `enabledDBs is a dict, but there are no subApps defined.`);
        }
    }
});

//.superRefine((appAllConfigs, ctx) => {
//});

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
    apps: allAppsSchema,
});
export type ReturnedFinalConfig = z.infer<typeof returnedFinalConfigSchema>;

const intermediateConfig = returnedFinalConfigSchema.deepPartial();
export type IntermediateConfig = z.infer<typeof intermediateConfig>;
