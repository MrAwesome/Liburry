// Generated by ts-to-zod
import {z} from "zod";

function realRecord<V extends z.ZodTypeAny>(val: V) {
    return z.record(val.optional());
};

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
    z.literal("search"),
    z.literal("markdown"),
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
    enabled: z.boolean().optional(),
    displayName: realRecord(z.string()),
    primaryKey: z.string(),
    loadInfo: rawDBLoadInfoSchema,
    fields: realRecord(rawAllowedFieldClassifierTagsSchema),
});
export type RawDBConfig = z.infer<typeof rawDBConfigSchema>;

export const rawAllDBConfigSchema = z.object({
    dbs: realRecord(rawDBConfigSchema),
});
export type RawAllDBConfig = z.infer<typeof rawAllDBConfigSchema>;

export const loadedConfigSchema = z.union([
    z.object({
        configType: z.literal("app_config"),
        config: rawAppConfigSchema,
    }),
    z.object({
        configType: z.literal("db_config"),
        config: rawAllDBConfigSchema,
    }),
    z.object({
        configType: z.literal("lang_config"),
        config: rawLangConfigSchema,
    })
]);

export type LoadedConfig = z.infer<typeof loadedConfigSchema>;
export type KnownConfigTypes = LoadedConfig["configType"];

const loadedPageSchema = z.object({
    pageType: z.literal("markdown"),
    pageName: z.string(),
    mdText: z.string(),
    lang: z.string(),
});
export type LoadedPage = z.infer<typeof loadedPageSchema>;

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

const fullAppConfigurationSchema = z.object({
    pages: realRecord(loadedPageSchema),
    configs: realRecord(loadedConfigSchema),
});
export type FullAppConfiguration = z.infer<typeof fullAppConfigurationSchema>;

export const returnedFinalConfigSchema = z.object({
    apps: realRecord(fullAppConfigurationSchema)
});
export type ReturnedFinalConfig = z.infer<typeof returnedFinalConfigSchema>;
