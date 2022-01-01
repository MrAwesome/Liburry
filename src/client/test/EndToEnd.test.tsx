import { chromium, Browser, Page, Response as Resp } from "playwright";

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

    test.skip("searchbar loads", async () => {
        // Get the HTTP status code of the response. A 200 means it loaded successfully!
        expect(response?.status()).toBe(200);
        const inputElem = await page?.waitForSelector("input");
        const placeholderObj = await inputElem.getProperty("placeholder");
        expect(await placeholderObj.jsonValue()).toBe("Search...");
    });

    test.skip("taigi.us specific POJ search", async () => {
        const vocabElem = await page?.waitForSelector(".vocab-element");
        const myname = vocabElem.asElement();
        expect(await myname.innerText()).toBe("A-le̍k-san-tāi");
    });
});
