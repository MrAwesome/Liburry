// TODO: use zod to verify values from env vars
export const REPO_LINK: string = "https://github.com/MrAwesome/Liburry";
// [] make a comma-separated list if from env var
export const CHHA_APPNAME: string = process.env.REACT_APP_CHHA_APPNAME || "taigi.us";
// TODO: enforce that this must be an absolute path
export const FINAL_CONFIG_LOCAL_DIR: string = process.env.REACT_APP_FINAL_CONFIG_LOCAL_DIR ||
    ((process.env.PUBLIC_URL ?? "") + "/generated/");
// TODO: should this have a leading slash?
export const FINAL_CONFIG_REMOTE_DIR: string = process.env.REACT_APP_FINAL_CONFIG_REMOTE_DIR || FINAL_CONFIG_LOCAL_DIR;
export const FINAL_CONFIG_JSON_FILENAME: string = process.env.REACT_APP_FINAL_CONFIG_JSON_FILNAME || "final.json";
