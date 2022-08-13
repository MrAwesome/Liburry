import {z} from "@mrawesome/zod";
import {LiburryTokenTypes, tokenMatchers} from "./zodTokenTypes";

export function realRecord<V extends z.ZodTypeAny, VK extends z.ZodString, S extends string>(
    keyRefiner: ((key: S | string) => key is S) | VK | null,
    valZodValidator: V,
):
    // Explicitly define the return type, to avoid splitting:
    // It returns a Record where:
    //  * each string key passes either a boolean check, or another zod parser
    //  * each value of type V passes valZodValidator
    z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodOptional<V>>,
        Record<string, V["_output"] | undefined>, Record<string, V["_input"] | undefined>> {

    const ret = z.record(valZodValidator.optional());
    if (keyRefiner === null) {
        // This refinement is to keep the return type of this function from splitting, which would
        // cause a gigantic increase in the complexity of our final config object
        return ret.refine(() => true);
    } else if ("safeParse" in keyRefiner) {
        const keyZodValidator = keyRefiner;
        return ret.superRefine(
            (rec, ctx) => {
                Object.keys(rec).forEach((key) => {
                    const parseResForKey = keyZodValidator.safeParse(key);
                    if (!parseResForKey.success) {
                        parseResForKey.error.issues.forEach(ctx.addIssue)
                    }
                });
            }
        );
    } else {
        const keyRefinerFunc = keyRefiner;
        return ret.refine(
            (obj) => Object.keys(obj).every(keyRefinerFunc)
        );
    }
}

export function strictObject<T extends z.ZodRawShape>(obj: T): z.ZodObject<T, "strict"> {
    return z.object(obj).strict();
}

export function tokenArray(tt: LiburryTokenTypes): z.ZodArray<z.ZodString, "atleastone"> {
    return z.array(token(tt)).nonempty();
}

export function anyString(): z.ZodString {
    return z.string().min(1);
}

export function token(tt: LiburryTokenTypes): z.ZodString {
    return matchToken(tt);
}

export function matchToken(tt: LiburryTokenTypes): z.ZodString {
    const retStr = anyString();
    const matcher = tokenMatchers[tt];
    if (matcher === null) {
        return retStr;
    } else {
        const [regex, explanation] = matcher;
        return retStr.regex(regex, `[${tt}]: ${explanation}`);
    }
}
