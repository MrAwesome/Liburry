import {loadFinalConfigForApps} from "../../scripts/compileYamlLib";
import {ReturnedFinalConfig} from "../configHandler/zodConfigTypes";

export async function genFinalConfigFromYaml(appIDs: string[]): Promise<ReturnedFinalConfig> {
    const rfc = await loadFinalConfigForApps(appIDs);
    // Always sanity check that we're actually loading something:
    expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    return rfc;
}

