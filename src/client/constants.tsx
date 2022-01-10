import {z} from 'zod';
import {BuildID, token} from './configHandler/zodConfigTypes';

// TODO: default to an app with help messages / docs?
const DEFAULT_FALLBACK_APP = "taigi.us";

const appIDTok = token('APP_ID');
const appIDTokArray = z.preprocess(
    (envvar) => {
        if (envvar === undefined) {
            console.log(`Environment variable REACT_APP_LIBURRY_BUILD_APPS not set, assuming ${DEFAULT_FALLBACK_APP}`);
            return [DEFAULT_FALLBACK_APP];
        } else {
            return String(envvar).split(",");
        }
    },
    z.array(token('APP_ID')).nonempty()
);


/// TODO: document, note that this is now the required var
export const LIBURRY_BUILD: BuildID | undefined = token('BUILD_ID').optional().parse(process.env.REACT_APP_LIBURRY_BUILD);

////////////////////////////////XXX REQUIRED XXX//////////////////////////////////////////////
// env(REACT_APP_LIBURRY_BUILD_APPS)
//   This single env variable is required at build time
//   to indicate which apps should be built.
//   It should be a comma-separated list of appIDs.
//
//  ex.:
//    export REACT_APP_LIBURRY_BUILD_APPS="taigi.us,test/simpletest"
////////////////////////////////XXX REQUIRED XXX//////////////////////////////////////////////
export const LIBURRY_BUILD_APPS: [string, ...string[]] =
 appIDTokArray.parse(process.env.REACT_APP_LIBURRY_BUILD_APPS);

//////////////////////////////////////////////////////////////////////////////////////////////
// env(REACT_APP_LIBURRY_DEFAULT_APP)
//   Used to set the default app. If not provided,
//   defaults to the first app in LIBURRY_BUILD_APPS or the build named in LIBURRY_BUILD.
//
// ex.:
//    export REACT_APP_LIBURRY_DEFAULT_APP="taigi.us"
//////////////////////////////////////////////////////////////////////////////////////////////
export const LIBURRY_DEFAULT_APP: string =
    appIDTok.parse(process.env.REACT_APP_LIBURRY_DEFAULT_APP || LIBURRY_BUILD_APPS[0]);

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
