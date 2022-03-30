import {strictObject, z} from "@mrawesome/zod";
import {anyString, realRecord, token} from "./zodUtils";

// TODO: can you globally check for the existence of dialects etc?

const rawTokenSchema = realRecord(token("I18N_TOKEN_ID"), anyString());

// NOTE: This is the canonical definition of what is a dialect
export const rawDialectSchema = strictObject({
    displayName: anyString(),
    // TODO: superRefine that these dialects are known
    otherDisplayNames: realRecord(token("DIALECT_ID"), anyString()).optional(),
    disabled: z.boolean().optional(),
    // TODO: check for validity
    fallbacks: z.array(token("DIALECT_ID")).optional(),
    tokens: rawTokenSchema.optional(),
});
export type RawDialect = z.infer<typeof rawDialectSchema>;

export const rawLangConfigSchema = strictObject({
    // TODO: check that this is a valid dialect
    defaultDialectID: token("DIALECT_ID"),
    dialects: realRecord(token("DIALECT_ID"), rawDialectSchema),
});

// TODO: check that dialect keys match token
export type RawLangConfig = z.infer<typeof rawLangConfigSchema>;
