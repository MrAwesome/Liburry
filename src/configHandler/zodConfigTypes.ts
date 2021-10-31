// The types here are those which go through some sort of serialization - to/from YAML or JSON in particular.
import {z} from "zod";
import {getRecordValues} from "../utils";

////// Utilities /////////////////////////////
function issue(ctx: z.RefinementCtx, message: string) {
    ctx.addIssue({code: z.ZodIssueCode.custom, message});
}

// NOTE: This isn't a particularly flexible/elegant way to check if we're checking the default app
function isDefaultApp(ctx: z.RefinementCtx) {
    return (ctx.path[1] === "default");
}

function realRecord<V extends z.ZodTypeAny>(val: V) {
    return z.record(val.optional());
};
//////////////////////////////////////////////

// TODO: use a zod schema for this.
export type AppID = string;

export const rawAppConfigSchema = z.object({
    displayName: z.string(),
});
export type RawAppConfig = z.infer<typeof rawAppConfigSchema>;

export const rawDialectSchema = z.object({
    displayName: z.string(),
    namesForOtherDialects: realRecord(z.string()).optional(),
});
export type RawDialect = z.infer<typeof rawDialectSchema>;

export const rawDBLoadInfoSchema = z.object({
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

export const rawLangConfigSchema = z.object({
    dialects: realRecord(rawDialectSchema),
});
export type RawLangConfig = z.infer<typeof rawLangConfigSchema>;

export const rawMenuLinksSchema = realRecord(
    z.object({
        mode: rawMenuLinkModeSchema,
        displayNames: realRecord(z.string()),
    })
);
export type RawMenuLinks = z.infer<typeof rawMenuLinksSchema>;

export const rawKnownDisplayTypeEntrySchema = z.object({
    dictionary: rawDictionaryFieldDisplayTypeSchema.optional(),
    fake_mtg: fakeMTGDisplayTypeSchema.optional(),
});
export type RawKnownDisplayTypeEntry = z.infer<typeof rawKnownDisplayTypeEntrySchema>;

export const rawAllowedFieldClassifierTagsSchema = z.object({
    type: rawKnownDisplayTypeEntrySchema.optional(),
    dialect: z.union([z.string(), z.array(z.string())]).optional(),
    delimiter: z.string().optional(),
    delimiterRegex: z.string().optional(),
    lengthHint: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
});
export type RawAllowedFieldClassifierTags = z.infer<typeof rawAllowedFieldClassifierTagsSchema>;

export const rawMenuConfigSchema = z.object({
    links: rawMenuLinksSchema,
});
export type RawMenuConfig = z.infer<typeof rawMenuConfigSchema>;

export const rawDBConfigSchema = z.object({
    disabled: z.boolean().optional(),
    displayName: realRecord(z.string()),
    primaryKey: z.string(),
    loadInfo: rawDBLoadInfoSchema,
    fields: realRecord(rawAllowedFieldClassifierTagsSchema),
}).superRefine((obj, ctx) => {
    if (obj.disabled !== false) {
        if (obj.primaryKey.length < 0) {
            issue(ctx, "primary key must be defined");
        }
        const displayNames = getRecordValues(obj.displayName);
        if (displayNames.length < 1) {
            issue(ctx, "at least one displayname must be defined");
        }
    }
});
export type RawDBConfig = z.infer<typeof rawDBConfigSchema>;

export const rawAllDBConfigSchema = z.object({
    dbs: realRecord(rawDBConfigSchema)
    .refine((rec) => Object.keys(rec).length > 0,
            "at least one DB must be defined")
    .refine(
        (allDBRec) => getRecordValues(allDBRec).filter(
            (dbc) => dbc.disabled !== true).length > 0,
        "at least one DB must be enabled"
    ),
});
export type RawAllDBConfig = z.infer<typeof rawAllDBConfigSchema>;

const loadedAllConfigSchema = z.object({
    "app_config": z.object({
        configType: z.literal("app_config"),
        config: rawAppConfigSchema,
    }),
    "db_config": z.object({
        configType: z.literal("db_config"),
        config: rawAllDBConfigSchema,
    }),
    "lang_config": z.object({
        configType: z.literal("lang_config"),
        config: rawLangConfigSchema,
    }),
    "menu_config": z.object({
        configType: z.literal("menu_config"),
        config: rawMenuConfigSchema,
    }),
});
type LoadedAllConfig = z.infer<typeof loadedAllConfigSchema>;

export type LoadedConfig = LoadedAllConfig[keyof LoadedAllConfig];
export type KnownConfigTypes = LoadedConfig["configType"];

// <SIN>
// Forgive me, for I have sinned. Just a union of the values of loadedAllConfigSchema.
// It was unclear how to accomplish this in zod without defining a separate list for the objects.
type LCS = typeof loadedAllConfigSchema.shape;
type LCSV = LCS[keyof LCS];
// @ts-ignore
const loadedConfigSchema: z.ZodUnion<[LCSV, LCSV, ...LCSV[]]> = z.union(Object.values(loadedAllConfigSchema.shape));
// </SIN>

export const configRecordSchema = loadedAllConfigSchema.partial();

const REQUIRED_CONFIGS: KnownConfigTypes[] = ["app_config", "db_config"];
const DEFAULT_REQUIRED_CONFIGS: KnownConfigTypes[] = ["lang_config", "menu_config"];

const loadedPageSchema = z.union([
    z.object({
        pageType: z.literal("markdown"),
        pageID: z.string(),
        mdText: z.string(),
        lang: z.string(),
    }),
    z.object({
        pageType: z.literal("HTML_UNUSED"),
        pageID: z.string(),
        htmlText: z.string(),
        lang: z.string(),
    }),
]);
export type LoadedPage = z.infer<typeof loadedPageSchema>;

export type PageType = LoadedPage["pageType"];
export type PageID = LoadedPage["pageID"];

const knownFileMetadata = z.object({
    idChain: z.array(z.string()),
    app: z.string(),
});

const loadedKnownFileSchema = z.union([
    z.object({
        type: z.literal("config"),
    })
        .merge(knownFileMetadata)
        .and(loadedConfigSchema),
    z.object({
        type: z.literal("page"),
    })
        .merge(knownFileMetadata)
        .and(loadedPageSchema),

]);
export type LoadedKnownFile = z.infer<typeof loadedKnownFileSchema>;

const allPages = realRecord(loadedPageSchema);
const allConfigs = configRecordSchema
.superRefine(
    (rec, ctx) => {
        if (!isDefaultApp(ctx)) {
            if (!REQUIRED_CONFIGS.every((conf) => conf in rec)) {
                const seenConfigs = Object.keys(rec);
                issue(ctx, `every app must have the following configs defined: [${REQUIRED_CONFIGS}]. Only found: [${seenConfigs}].`);
            }
        } else {
            if (!DEFAULT_REQUIRED_CONFIGS.every((conf) => conf in rec)) {
                const seenDefaultConfigs = Object.keys(rec);
                issue(ctx, `"default" must have the following configs defined: [${DEFAULT_REQUIRED_CONFIGS}]. Only found: [${seenDefaultConfigs}].`);
            }
        }
    }
);

const fullAppConfigurationSchema = z.object({
    pages: allPages,
    configs: allConfigs,
});
export type FullAppConfiguration = z.infer<typeof fullAppConfigurationSchema>;

const allAppsSchema = realRecord(fullAppConfigurationSchema)
.refine(
    (rec) => Object.keys(rec).length > 1,
    "at least one non-default app configuration must be defined"
);

export const returnedFinalConfigSchema = z.object({
    apps: allAppsSchema,
});
export type ReturnedFinalConfig = z.infer<typeof returnedFinalConfigSchema>;
