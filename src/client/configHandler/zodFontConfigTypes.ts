import {z} from "zod";
import {noop} from "../utils";
import {TypeEquals} from "../utils/typeEquality";

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

const fontConfigTypeSchema = z.enum(["custom"]);

const customFontConfigSchema = z.object({
    type: fontConfigTypeSchema,
    family: z.string().nonempty(),
    localUrl: z.string().nonempty(), // TODO: verify starts with /fonts/
    descriptors: fontFaceDescriptorsSchema.default({display: "swap"}),
});
export type CustomFontConfig = z.infer<typeof customFontConfigSchema>;

// NOTE: when more config types are added, this can be z.union([blah, blah])
export const fontConfigSchema = customFontConfigSchema;
export type FontConfig = z.infer<typeof fontConfigSchema>;
