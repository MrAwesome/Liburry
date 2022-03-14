import CompiledJSONFinalConfigHandler from "./CompiledJSONFinalConfigHandler";
import type {MuhError} from "../errorHandling/MuhError";
import type {ReturnedFinalConfig} from "./zodConfigTypes";

// NOTE: this test just reads from final.json, so it's not particularly useful and will
//       break on new installations pre-build
//
// Run zod parsing in an integration test, with a fallback check just to ensure the resulting
// object looks like we expect
test.skip('finalconfig check', async () => {
    const configHandler = new CompiledJSONFinalConfigHandler({localMode: true});
    const finalConfig = await configHandler.genLoadFinalConfig();
    if ((finalConfig as MuhError).muhErrType !== undefined) {
        console.error("Failed to load final config.");
        throw (finalConfig as MuhError);
    }
    const rfc = finalConfig as ReturnedFinalConfig;
    expect(rfc).toHaveProperty("appConfigs");
    expect(Object.keys(rfc.appConfigs).length).toBeGreaterThan(0);
    expect(rfc.default.configs.langConfig.config.dialects.eng_us!.displayName).toBe("English (US)");
});
