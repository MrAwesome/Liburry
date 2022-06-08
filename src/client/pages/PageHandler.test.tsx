import I18NHandler from "../../common/i18n/I18NHandler";
import {KnownDialectID} from "../../generated/i18n";
import {genLoadFinalConfigWILLTHROW} from "../../scripts/compileYamlLib";
import {DBConfigHandler} from "../configHandler/AppConfig";
import PageHandler from "../pages/PageHandler";

const buildID = 'test/basic';
const appID = 'test/simpletest';

async function getHandlerForDialectID(dialectID: KnownDialectID) {
    const rfc = await genLoadFinalConfigWILLTHROW({buildID});


    const dbConfigHandler = new DBConfigHandler(rfc.appConfigs[appID]!.configs.dbConfig.config, undefined);
    const i18nHandler = new I18NHandler(rfc, dialectID);

    const pageHandler = PageHandler.fromFinalConfig(rfc, i18nHandler, dbConfigHandler, appID);
    return pageHandler;
}

async function testLicensePageForDialect(dialectID: KnownDialectID, s1: string, s2: string) {
    const ph = await getHandlerForDialectID(dialectID);
    const licensePages = ph.getPagesForPageID("licenses");
    const page = licensePages.get(appID)!;
    expect(page).toHaveProperty("mdText");
    if ("mdText" in page) {
        expect(page.mdText).toContain(s1);
        expect(page.mdText).toContain(s2);
    }
}


test('test license page titles for various languages', async () => {
    testLicensePageForDialect("eng_us", "Angry!", "Happy!");
    testLicensePageForDialect("mand_tw", "生氣的", "生氣的");

    // Tests fallback to mand_tw:
    testLicensePageForDialect("mand_cn", "生氣的", "生氣的");

    // Tests fallback to default lang:
    testLicensePageForDialect("hok_tw_poj", "Angry!", "Happy!");
});
