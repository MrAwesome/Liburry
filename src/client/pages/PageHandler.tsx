import {AppID, LoadedPage, MarkdownPage, PageID, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {getRecordEntries} from "../utils";

// TODO: method for sorting the combinedpages by some score (how does this work when combinedpages are defined separately? should they be defined all together?)

// TODO: use a unique id, show an actual displayname
const LICENSEINFO_PAGEID: PageID = "licenses";

export default class PageHandler {
    constructor(
        private pages: Map<PageID, Map<AppID, LoadedPage>>,
    ) {
        this.getPageIDs = this.getPageIDs.bind(this);
        this.getPagesForPageID = this.getPagesForPageID.bind(this);
    }

    // TODO: unit test
    static fromFinalConfig(
        finalConfig: ReturnedFinalConfig,
        selectedAppID: AppID,
    ) {
        // NOTE: default is second, so that page-specific info comes first

        const thisApp = finalConfig.appConfigs[selectedAppID];
        if (thisApp === undefined) {
            throw new Error(`App not found: ${selectedAppID}`);
        }

        const apps = [
            thisApp,
            finalConfig.default,
        ];

        const pageMaps: Map<PageID, Map<AppID, LoadedPage>> = new Map();

        // TODO: here: generate generated-pages

        apps.forEach((app) => {
            const {appID} = app;

            const pageConfig = app.pages;
            getRecordEntries(pageConfig).forEach(([pageID, loadedPage]) => {
                const thisPage = pageMaps.get(pageID);
                if (thisPage === undefined) {
                    const newThisPage: Map<AppID, LoadedPage> = new Map();
                    newThisPage.set(appID, loadedPage);
                    pageMaps.set(pageID, newThisPage);
                } else {
                    thisPage.set(appID, loadedPage);
                }
            });

            if (
                "dbConfig" in app.configs &&
                // Allow power users to override licenseinfo page by creating a page with this name
                pageMaps.get(LICENSEINFO_PAGEID)?.get(appID) === undefined
            ) {
                const {dbConfigs} = app.configs.dbConfig.config;
                const dbLicenseInfoMarkdown = getRecordEntries(dbConfigs).map(([dbID, dbConfig]) => {
                    // TODO: get displayname per lang here? or when actually displayed? confusing...
                    const {source,license} = dbConfig;
                    return `## ${dbID}\n\n<${source}>\n\nLicense: ${license}`
                }).join("\n");

                const licensePage: MarkdownPage = {
                    pageID: LICENSEINFO_PAGEID,
                    pageType: "markdown",
                    mdText: dbLicenseInfoMarkdown,
                    dialect: "any", // XXX
                }

                const thisAppPage = new Map();
                thisAppPage.set(appID, licensePage);
                pageMaps.set(LICENSEINFO_PAGEID, thisAppPage)
            }

        });

        return new PageHandler(pageMaps);
    }

    getPageIDs() {
        return Array.from(this.pages.keys());
    }

    getPagesForPageID(pageID: PageID): Map<AppID, LoadedPage> {
        const targetPages = this.pages.get(pageID);
        if (targetPages === undefined) {
            console.info(this.pages);
            console.info({pageID});
            throw new Error(`Page not found: ${pageID}`);
        }
        else {
            return targetPages;
        }
    }

    getLinkTitle(pageID: PageID) {
        // TODO: Better way of doing this?
        return pageID;
    }
}
