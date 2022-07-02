import {z} from "@mrawesome/zod";
import {getRecordEntries, noop} from "../utils";
import {TypeEquals} from "../utils/typeEquality";
import {issue} from "./zodIssue";
import {realRecord, token} from "./zodUtils";

const fontFaceDescriptorsSchemaMatchesUpstream = z.object({
    display: z.string().optional(),
    featureSettings: z.string().optional(),
    stretch: z.string().optional(),
    style: z.string().optional(),
    unicodeRange: z.string().optional(),
    variant: z.string().optional(),
    weight: z.string().optional(),
});
type FFDBeforeModifications = z.infer<typeof fontFaceDescriptorsSchemaMatchesUpstream>;

// If the FontFaceDescriptors type changes in TypeScript, this will throw a type error.
const _ffdTypeDidNotChangeUpstream: TypeEquals<FontFaceDescriptors, FFDBeforeModifications> = true;
noop(_ffdTypeDidNotChangeUpstream);

// Once we're sure we're modifying a real FontFaceDescriptors, override any defaults we want.
const fontFaceDescriptorsSchema = fontFaceDescriptorsSchemaMatchesUpstream.extend({
    display: z.string().default("swap"),
});

const customFontConfigSchema = z.object({
    type: z.literal("custom"),
    family: z.string().nonempty(),
    localUrl: z.string().nonempty(), // TODO: verify starts with /fonts/
    descriptors: fontFaceDescriptorsSchema.default({display: "swap"}),
});
export type CustomFontConfig = z.infer<typeof customFontConfigSchema>;

const systemFontConfigSchema = z.object({
    type: z.literal("system"),
    family: z.string().nonempty(),
});
export type SystemFontConfig = z.infer<typeof systemFontConfigSchema>;

// NOTE: when more config types are added, this can be z.union([blah, blah])
export const individualFontConfigSchema = z.union([customFontConfigSchema, systemFontConfigSchema]);
export type FontConfig = z.infer<typeof individualFontConfigSchema>;

export const fontIDToFontConfigSchema = realRecord(
    token("FONT_ID"),
    individualFontConfigSchema,
);

export const fontGroupConfigSchema = realRecord(
    token("FONT_GROUP_ID"),
    z.array(token("FONT_ID")).nonempty(),
);

// TODO: add names as keys
// TODO: confirm that names are valid when present in font groups

export const rawFontConfigSchema = z.object({
    fonts: fontIDToFontConfigSchema,
    fontGroups: fontGroupConfigSchema,
}).superRefine((fontFileConfig, ctx) => {
    const definedFontIDs = new Set(Object.keys(fontFileConfig.fonts));
    getRecordEntries(fontFileConfig.fontGroups).forEach(([fontGroupID, fontGroupArray]) => {
        fontGroupArray.forEach((font) => {
            if (!definedFontIDs.has(font)) {
                issue(ctx, "invalid_font_in_font_group", `Invalid font ID "${font}" in font group "${fontGroupID}"`);
            }
        });
    });
});
