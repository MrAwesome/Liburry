import ConfigHandler from "./ConfigHandler";
import type {MuhError} from "../errorHandling/MuhError";
import type {ReturnedFinalConfig} from "./zodConfigTypes";

// Run zod parsing in an integration test, with a fallback check just to ensure the resulting
// object looks like we expect
test('finalconfig check', async () => {
    const configHandler = new ConfigHandler(true);
    const finalConfig = await configHandler.genLoadFinalConfig();
    if ((finalConfig as MuhError).muhErrType !== undefined) {
        console.error("Failed to load final config.");
        throw (finalConfig as MuhError);
    }
    const rfc = finalConfig as ReturnedFinalConfig;
    expect(rfc).toHaveProperty("apps");
    expect(rfc.apps.default!.configs.lang_config!.config.dialects.eng_us!).toHaveProperty("displayName");
});
