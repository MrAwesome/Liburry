import ConfigHandler from "./ConfigHandler";
import type {MuhError} from "../errorHandling/MuhError";
import type {ReturnedFinalConfig} from "./zodConfigTypes";

// Run zod parsing in an integration test, with a fallback check just to ensure the resulting
// object looks like we expect
test('finalconfig check', async () => {
    const configHandler = new ConfigHandler({localMode: true});
    const finalConfig = await configHandler.genLoadFinalConfig();
    if ((finalConfig as MuhError).muhErrType !== undefined) {
        console.error("Failed to load final config.");
        throw (finalConfig as MuhError);
    }
    const rfc = finalConfig as ReturnedFinalConfig;
    expect(rfc).toHaveProperty("apps");
    expect(Object.keys(rfc.apps).length).toBeGreaterThan(0);
    expect(rfc.default.configs.langConfig.config.dialects.eng_us!.displayName).toBe("English (US)");
});
