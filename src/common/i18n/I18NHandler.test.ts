import {genLoadFinalConfigWILLTHROW} from "../../scripts/compileYamlLib";
import I18NHandler from "./I18NHandler";

// TODO: test fallback behavior

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
