import {z} from '@mrawesome/zod';
import type {BuildID} from './configHandler/zodConfigTypes';
import {token} from './configHandler/zodUtils';

// TODO: default to an app with help messages / docs?
const DEFAULT_FALLBACK_APP = "taigi.us";

const appIDTok = token('APP_ID');
const appIDTokArray = z.preprocess(
    (envvar) => {
        if (envvar === undefined) {
            return [DEFAULT_FALLBACK_APP];
        } else {
            return String(envvar).split(",");
        }
    },
    z.array(token('APP_ID')).nonempty()
);

//////////////////////////////////////////////////////////////////////////////////////////////
// env(REACT_APP_LIBURRY_BUILD)
//   The name of a single BuildID.
//
// ex.:
//   export REACT_APP_LIBURRY_BUILD="chhataigi"
export const LIBURRY_BUILD: BuildID | undefined = token('BUILD_ID').optional().parse(process.env.REACT_APP_LIBURRY_BUILD);
//////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////
// env(REACT_APP_LIBURRY_APPS_OVERRIDE)
//   Should be a comma-separated list of "AppID"s. This will override the apps defined
//   in the configuration for LIBURRY_BUILD, if it is given. If "all" is given, all apps will
//   be built.
//
// ex.:
//   export REACT_APP_LIBURRY_APPS_OVERRIDE="taigi.us,test/simpletest"
//////////////////////////////////////////////////////////////////////////////////////////////
const buildApps: string | undefined = process.env.REACT_APP_LIBURRY_APPS_OVERRIDE;

export const LIBURRY_APPS_OVERRIDE: [string, ...string[]] | "all" | undefined =
    buildApps !== undefined
        ? (buildApps === "all" ?
            buildApps :
            appIDTokArray.parse(buildApps))
        : undefined;

//////////////////////////////////////////////////////////////////////////////////////////////
// env(REACT_APP_LIBURRY_INITIAL_APP_OVERRIDE)
//   Used to set the app which will be loaded initially. If not provided,
//   defaults to the first app in LIBURRY_BUILD_APPS or the app list
//   for the build named in LIBURRY_BUILD.
//
// ex.:
//    export REACT_APP_LIBURRY_INITIAL_APP_OVERRIDE="taigi.us"
//////////////////////////////////////////////////////////////////////////////////////////////
const defaultApp: string | undefined = process.env.REACT_APP_LIBURRY_INITIAL_APP_OVERRIDE;
export const LIBURRY_INITIAL_APP_OVERRIDE: string | undefined =
    defaultApp !== undefined
        ? appIDTok.parse(defaultApp)
        : undefined;

//////////////////////////////////////////////////////////////////////////////////////////////
// env(REACT_APP_REPO_LINK)
//   Used to change the repository link displayed on the about page.
//////////////////////////////////////////////////////////////////////////////////////////////
export const REPO_LINK: string = process.env.REACT_APP_REPO_LINK || "https://github.com/MrAwesome/Liburry";


/////////////////////////////////// INTERNAL ////////////////////////////////////////////////////
// These env vars are used for advanced configuration of builds,
// and most likely can be ignored by most users.
//////////////////////////////////////////////////////////////////////////////////////////////
// TODO: enforce that this must be an absolute path
export const FINAL_CONFIG_LOCAL_DIR: string = process.env.REACT_APP_FINAL_CONFIG_LOCAL_DIR ||
    ((process.env.PUBLIC_URL ?? "") + "/generated/");
// TODO: should this have a leading slash?
export const FINAL_CONFIG_REMOTE_DIR: string = process.env.REACT_APP_FINAL_CONFIG_REMOTE_DIR || FINAL_CONFIG_LOCAL_DIR;
export const FINAL_CONFIG_JSON_FILENAME: string = process.env.REACT_APP_FINAL_CONFIG_JSON_FILNAME || "final.json";
