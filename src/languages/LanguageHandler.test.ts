import {RawLangConfig} from "../configHandler/rawConfigTypes";
import {loadTestYaml} from "../utils/yaml";
import LanguageHandler from "./LanguageHandler";

test('test instantiate LanguageHandler', async () => {
    const testDataFilename = "src/languages/testData/validConfig.yml";
    const rawLangConfig: RawLangConfig = await loadTestYaml(testDataFilename);
    const h = LanguageHandler.from(rawLangConfig);
    const dialects = h.getAllDialects();
    const d1 = dialects[0];
    expect(d1.getID()).toBe("fake1_dialect1");
    expect(d1.getDisplayName()).toBe("FAKE1 (DIALECT1)");
});
