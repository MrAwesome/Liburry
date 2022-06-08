import I18NHandler from "../../common/i18n/I18NHandler";
import {DBConfigHandler} from "../configHandler/AppConfig";
import {AppID, LoadedPage, MarkdownPage, PageID, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {getRecordEntries} from "../utils";

// TODO: method for sorting the combinedpages by some score (how does this work when combinedpages are defined separately? should they be defined all together?)

// TODO: use a unique id, show an actual displayname
const LICENSEINFO_PAGEID: PageID = "licenses";

export default class PageHandler {
    constructor(
        private pages: Map<PageID, Map<AppID, LoadedPage>>,
        private i18nHandler: I18NHandler,
    ) {
        this.getPageIDs = this.getPageIDs.bind(this);
        this.getPagesForPageID = this.getPagesForPageID.bind(this);
    }

    // TODO: unit test
    static fromFinalConfig(
        finalConfig: ReturnedFinalConfig,
        i18nHandler: I18NHandler,
        dbConfigHandler: DBConfigHandler,
        selectedAppID: AppID,
    ) {
        const {tok, getKnownDialectIDChainAsList} = i18nHandler;

        const knownDialectIDs = getKnownDialectIDChainAsList();

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
                // NOTE: we regenerate the full appconfig on lang changes, so this will be regenerated if the dialect changes.
                const dbLicenseInfoMarkdown = dbConfigHandler.getAllEnabledDBConfigs().map((dbConfig) => {
                    const dbID = dbConfig.getDBIdentifier();

                    let disp: string | undefined = undefined;
                    for (const dialectID of knownDialectIDs) {
                        disp = dbConfig.getDisplayName(dialectID);
                        if (disp !== undefined) {
                            break;
                        }
                    }
                    if (disp === undefined) {
                        disp = dbID;
                    }

                    const source = dbConfig.getSourceURL();
                    const license = dbConfig.getLicenseString();
                    return `## ${disp}\n\n${tok("data_source")}: <${source}>\n\n${tok("license")}: *${license}*`
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

        return new PageHandler(pageMaps, i18nHandler);
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
        //
        const {tok, isTok} = this.i18nHandler;

        const maybeI18NToken = "pages/" + pageID;
        if (isTok(maybeI18NToken)) {
            return tok(maybeI18NToken);
        }
        return pageID;
    }
}
