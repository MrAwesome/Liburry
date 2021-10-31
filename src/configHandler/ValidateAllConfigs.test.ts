import ConfigHandler from "./ConfigHandler";

// Run zod parsing in an integration test, with a fallback check just to ensure the resulting
// object looks like we expect
test('finalconfig check', async () => {
    const configHandler = new ConfigHandler(true);
    const finalConfig = await configHandler.genLoadFinalConfig();
    expect(finalConfig).toHaveProperty("apps");
    expect(finalConfig.apps.default!.configs.lang_config!.config.dialects.eng_us!).toHaveProperty("displayName");
});
