// [] check lang names for displayName everywhere
//
// The types here are those which go through some sort of serialization - to/from YAML or JSON in particular.
import {z} from "zod";
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
//////////////////////////////////////////////


const nonDefaultAppID = z.string().refine((s) => s !== "default");
const defaultAppID = z.literal("default");
// TODO: use a zod schema for this.
export type AppID = z.infer<typeof nonDefaultAppID>;
export type SubAppID = string;

export const rawSubAppConfigSchema = strictObject({
    displayName: z.string(),
});

export const rawAppConfigSchema = strictObject({
    displayName: z.string(),
    defaultSubApp: z.string(),
    subApps: realRecord(rawSubAppConfigSchema),
})
    .refine(
        (appConfig) => Object.keys(appConfig.subApps).includes(appConfig.defaultSubApp),
        (appConfig) => ({
            message: `defaultSubApp "${appConfig.defaultSubApp}" not found in subApps: "${Object.keys(appConfig.subApps)}"`,
            appDisplayName: [appConfig.displayName],
        }),
    );
export type RawAppConfig = z.infer<typeof rawAppConfigSchema>;

export const rawDialectSchema = strictObject({
    displayName: z.string(),
    namesForOtherDialects: realRecord(z.string()).optional(),
});
export type RawDialect = z.infer<typeof rawDialectSchema>;

export const rawDBLoadInfoSchema = strictObject({
    localCSV: z.string().optional(),
    localLunr: z.string().optional(),
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
        displayNames: realRecord(z.string()),
    })
);
export type RawMenuLinks = z.infer<typeof rawMenuLinksSchema>;

export const rawKnownDisplayTypeEntrySchema = strictObject({
    dictionary: rawDictionaryFieldDisplayTypeSchema.optional(),
    fake_mtg: fakeMTGDisplayTypeSchema.optional(),
});
export type RawKnownDisplayTypeEntry = z.infer<typeof rawKnownDisplayTypeEntrySchema>;

export const rawAllowedFieldClassifierTagsSchema = strictObject({
    type: rawKnownDisplayTypeEntrySchema.optional(),
    dialect: z.union([z.string(), z.array(z.string())]).optional(),
    delimiter: z.string().optional(),
    delimiterRegex: z.string().optional(),
    lengthHint: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
});
export type RawAllowedFieldClassifierTags = z.infer<typeof rawAllowedFieldClassifierTagsSchema>;

export const rawMenuConfigSchema = strictObject({
    links: rawMenuLinksSchema,
});
export type RawMenuConfig = z.infer<typeof rawMenuConfigSchema>;

const fieldsSchema = realRecord(rawAllowedFieldClassifierTagsSchema);
export const rawDBConfigSchema = strictObject({
    displayName: realRecord(z.string()),
    primaryKey: z.string(),
    searchableFields: z.array(z.string()).nonempty(),
    loadInfo: rawDBLoadInfoSchema,
    fields: fieldsSchema,
}).superRefine((obj, ctx) => {
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
    obj.searchableFields.forEach((givenFieldName) => {
        if (!(givenFieldName in obj.fields)) {
            issue(ctx, `searchableField "${givenFieldName}" is not a known field`);
        }
    });
});
export type RawDBConfig = z.infer<typeof rawDBConfigSchema>;

export const rawAllDBConfigSchema = strictObject({
    dbList: z.array(z.string()).nonempty(),
    enabledDBs: realRecord(z.array(z.string()).nonempty()),
    dbConfigs: realRecord(rawDBConfigSchema),
}).superRefine((allDBConfig, ctx) => {
    const {dbList, dbConfigs, enabledDBs} = allDBConfig;
    dbList.forEach((dbName) => {
        if (!(dbName in dbConfigs)) {
            issue(ctx, `"${dbName}" must have a config defined in "dbConfigs"`);
        }
    });

    getRecordEntries(enabledDBs).forEach(([subAppName, enabledDBList]) => {
        enabledDBList.forEach((dbName) => {
            if (!(dbList.includes(dbName))) {
                issue(ctx, `"${dbName}" is not a valid DB name in enabledDBs for "${subAppName}" (check "dbList")`);
            }
        });
    });

    getRecordEntries(allDBConfig.dbConfigs).forEach(([dbName, _dbConfig]) => {
        if (!(dbList.includes(dbName))) {
            issue(ctx, `"${dbName}" is not a valid DB name in dbConfigs (check "dbList")`);
        }
    });
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

// <SIN>
// Forgive me, for I have sinned. Just a union of the values of loadedAllConfigSchema.
// It was unclear how to accomplish this in zod without defining a separate list for the objects.
//type LCS = typeof loadedAllConfigSchema.shape;
//type LCSV = LCS[keyof LCS];
// @ts-ignore
//const loadedConfigSchema: z.ZodUnion<[LCSV, LCSV, ...LCSV[]]> = z.union(Object.values(loadedAllConfigSchema.shape));
// </SIN>

export const configRecordSchema = loadedAllConfigSchema.partial();

const mdPageSchema = strictObject({
    pageType: z.literal("markdown"),
    pageID: z.string(),
    mdText: z.string(),
    lang: z.string(),
});

const htmlPageSchema = strictObject({
    pageType: z.literal("HTML_UNUSED"),
    pageID: z.string(),
    htmlText: z.string(),
    lang: z.string(),
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
    const subAppNames = Object.keys(appConfig.subApps);

    subAppNames.forEach((subAppName) => {
        if (!(subAppName in enabledDBs)) {
            issue(ctx, `subApp "${subAppName}" must have an entry in "enabledDBs"`);
        }
    });
});

//.superRefine((appAllConfigs, ctx) => {
//});

const appTopLevelConfigurationSchema = strictObject({
    appID: nonDefaultAppID,
    pages: allPagesSchema,
    configs: appAllConfigSchema,
});

const defaultTopLevelConfigurationSchema = strictObject({
    appID: defaultAppID,
    pages: allPagesSchema,
    configs: defaultAllConfigSchema,
});

const allAppsSchema = z.object({default: z.undefined()})
    .catchall(appTopLevelConfigurationSchema)
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
