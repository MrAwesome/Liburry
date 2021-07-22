import ConfigHandler from "./ConfigHandler";

test('language configs', async () => {
    // TODO: walk config directory, see all configs
    const ch = new ConfigHandler("taigi.us", true);
    const configs = await ch.loadLanguageConfigs();

    // TODO: have yaml fail if doesn't match cast type
    // TODO: for now, hardcode expected schema
    for (const langKey in configs) {
        expect(configs[langKey]).toHaveProperty("displayName");
    }
});

test('app configs', async () => {
    const ch = new ConfigHandler("taigi.us", true);
    const configs = await ch.loadAppConfig();

    // TODO: have yaml fail if doesn't match cast type
    // TODO: for now, hardcode expected schema
    expect(configs.name).toBe("taigi.us");
    expect(configs.displayName).toBe("Chhâ Tâi-gí!");
    expect(configs.interfaceLangs).toContain("eng");
});

test('db configs', async () => {
    const ch = new ConfigHandler("taigi.us", true);
    const configs = await ch.loadDBConfig();
}
