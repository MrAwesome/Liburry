import {z} from "@mrawesome/zod";

export const liburryCustomErrorCodes = [
    "invalid_subapp_name_in_edbs",
    "enableddbs_dict_has_no_subapps",
    "dbconfig_name_not_valid",
    "dbname_needs_config",
    "invalid_view_for_db",
    "view_set_for_db_with_no_views",
    "view_not_set_for_db_in_subapp",
    "edbs_is_list_but_views_defined_list",
    "enabled_dbname_not_valid_array",
    "enabled_dbname_not_valid_views",
    "unknown_field_in_behavior_list",
    "primarykey_known_field",
    "remote_files_https",
    "local_file_absolute_path",
    "defaultsubapp_subapps_both_or_neither",
    "defaultsubapp_defined",
    "build_defaultapp_defined",
] as const;

export type LiburryZodCustomTestingCode = (typeof liburryCustomErrorCodes)[number];

export type LiburryZodCustomIssue = z.ZodIssue & {
    _liburryCode: LiburryZodCustomTestingCode,
}

////// Utilities /////////////////////////////
export function issue(ctx: z.RefinementCtx, _liburryCode: LiburryZodCustomTestingCode, message: string) {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        // Add our own custom code for tests:
        // @ts-ignore
        _liburryCode,
    });
}
