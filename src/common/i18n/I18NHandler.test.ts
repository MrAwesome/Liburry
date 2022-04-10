import {genLoadFinalConfigWILLTHROW} from "../../scripts/compileYamlLib";
import I18NHandler from "./I18NHandler";

// TODO: test fallback behavior
// TODO: prevent infinite loops on fallback <->

test("basic handler loading / switching", async () => {
    const engApp = "App";
    const mandApp = "應用程序 (APP)";

    const rfc = await genLoadFinalConfigWILLTHROW();
    const h = new I18NHandler(rfc, "eng_us");
    expect(h.tok("app")).toBe(engApp);
    expect(h.tokForDialect("app", "mand_tw")).toBe(mandApp);

    h.changeDialect("mand_tw");
    expect(h.tok("app")).toBe(mandApp);
    expect(h.tokForDialect("app", "eng_us")).toBe(engApp);
});

//test("handler unknown token", async () => {
//});

//test("handler fallback", async () => {
//    const rfc = await genLoadFinalConfigWILLTHROW();
//    const h = new I18NHandler(rfc, "testlang1");
//    expect(h.tok("search")).toBe("Search in Lang 2");
//    expect(h.tok("subapp")).toBe("Subapp in Lang 3");
//});
