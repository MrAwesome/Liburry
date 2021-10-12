import LanguageHandler from "../languages/LanguageHandler";
import ConfigHandler from "./ConfigHandler";

//test('language configs', async () => {
//    // TODO: walk config directory, see all configs
//    const ch = new ConfigHandler("taigi.us", true);
//    const configs = await ch.loadLanguageConfigs();
//
//    // TODO: have yaml fail if doesn't match cast type
//    // TODO: for now, hardcode expected schema
//    for (const langKey in configs) {
//        expect(configs[langKey]).toHaveProperty("displayName");
//    }
//});

test('app configs', async () => {
    const ch = new ConfigHandler("taigi.us", true);
    const configs = await ch.loadAppConfig();

    // TODO: have yaml fail if doesn't match cast type
    // TODO: for now, hardcode expected schema
    expect(configs.displayName).toBe("Chhâ Tâi-gí!");
});

// TODO: same handler pattern as below
test('db configs', async () => {
    const ch = new ConfigHandler("taigi.us", true);
    const configs = await ch.loadDBConfigs();
    expect(configs["ChhoeTaigi_TaioanPehoeKichhooGiku"]).toBeTruthy();
});

test('lang configs', async () => {
    const ch = new ConfigHandler("taigi.us", true);
    const rawLangConfig = await ch.loadLanguageConfigs();
    const h = LanguageHandler.from(rawLangConfig);
    const dialects = h.getAllDialects();
    expect(dialects[0].getID()).toBe("tw_poj");
});
