import {genLoadFinalConfigWILLTHROW} from "../../scripts/compileYamlLib";
import {MuhError, MuhErrorType} from "../errorHandling/MuhError";
import ConfigHandler from "./ConfigHandler";

// TODO(high): test loading of RFC

test('ConfigHandler explicitly-requested error is thrown', async () => {
    const ch = new ConfigHandler({shouldFailToLoad: true});
    expect.assertions(2);
    return ch.genLoadFinalConfigLocalUNSAFE().catch((err: MuhError) => {
        expect(err.muhErrType).toBe(MuhErrorType.EXPLICIT_FAILURE_REQUESTED);
        expect(err.muhErrType).not.toBe(MuhErrorType.RFC_PARSE);
    });
});

test('ConfigHandler creation from yaml -> json parse/stringify', async () => {
    const appID = "test/simpletest";
    const rfcFromYaml = await genLoadFinalConfigWILLTHROW({appIDs: [appID]});

    const ch = new ConfigHandler({testRFCOverrideJSONText: JSON.stringify(rfcFromYaml)});
    const rfc = await ch.genLoadFinalConfigLocalUNSAFE();
    expect(rfc.appConfigs).toHaveProperty(appID);
    expect(rfc.appConfigs[appID]?.configs.appConfig.config.displayName).toBe("Simple Test App");
    expect(rfc.appConfigs[appID]?.configs.appConfig.config.displayName).toBe(rfcFromYaml.appConfigs[appID]?.configs.appConfig.config.displayName);
});
