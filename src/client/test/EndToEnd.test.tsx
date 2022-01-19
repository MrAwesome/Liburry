import { chromium, Browser, Page, Response as Resp } from "playwright";

// TODO: have skipped tests only run if a certain env var is set

const expensiveTest = process.env.REACT_APP_LIBURRY_RUN_E2E_TESTS === "true" ?
    test :
    test.skip;

// NOTE: each test here starts a new browser, so add new ones sparingly
describe("Main End-To-End Tests", () => {
    let response: Resp | null;
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        browser = await chromium.launch({args: ["--ignore-certificate-errors"]});
        page = await browser.newPage();
        //response = await page.goto("https://localhost:3000/");
        response = await page.goto("https://localhost:3000/#m=SEARCH;q=alexander");
    });

    afterAll(async () => {
        await browser?.close();
    });

    expensiveTest("searchbar loads", async () => {
        // Get the HTTP status code of the response. A 200 means it loaded successfully!
        expect(response?.status()).toBe(200);
        const inputElem = await page?.waitForSelector("input");
        const placeholderObj = await inputElem.getProperty("placeholder");
        expect(await placeholderObj.jsonValue()).toBe("Search...");
    });

    expensiveTest("taigi.us specific POJ search", async () => {
        const vocabElem = await page?.waitForSelector(".vocab-element");
        const myname = vocabElem.asElement();
        expect(await myname.innerText()).toBe("A-le̍k-san-tāi");
    });
});
