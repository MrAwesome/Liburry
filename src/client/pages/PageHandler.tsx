import I18NHandler from "../../common/i18n/I18NHandler";
import {KnownDialectID} from "../../generated/i18n";
import {DBConfigHandler} from "../configHandler/AppConfig";
import {AppID, LoadedPage, MarkdownPage, PageID, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
//import {getRecordValues} from "../utils";

// TODO: method for sorting the combinedpages by some score (how does this work when combinedpages are defined separately? should they be defined all together?)

// TODO: use a unique id, show an actual displayname
const LICENSEINFO_PAGEID: PageID = "licenses";

export default class PageHandler {
    knownPageIDs: Set<PageID>;

    constructor(
        private pages: LoadedPage[],
        private i18nHandler: I18NHandler,
    ) {
        this.getPageIDs = this.getPageIDs.bind(this);
        this.getPagesForPageID = this.getPagesForPageID.bind(this);

        this.knownPageIDs = new Set(pages.map((p) => p.pageID));
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

        const knownDialectIDsWithPriority: Map<KnownDialectID, number> = new Map(knownDialectIDs.map((k, i) => [k, i]));

        // NOTE: default is second, so that page-specific info comes first
        const thisApp = finalConfig.appConfigs[selectedAppID];
        if (thisApp === undefined) {
            throw new Error(`App not found: ${selectedAppID}`);
        }

        const apps = [
            thisApp,
            finalConfig.default,
        ];

        let loadedPages: LoadedPage[] = [];

        // TODO: here: generate generated-pages

        apps.forEach((app) => {
            const {appID} = app;

            // XXX NOTE: This is quite inefficient, and can be improved significantly.
            const found: Set<PageID> = new Set();
            for (const k of knownDialectIDs) {
                for (const p of app.pages) {
                    const {pageID, dialect} = p;
                    if (!found.has(pageID) && dialect === k) {
                        console.log({p, k});
                        loadedPages.push(p);
                        found.add(pageID);
                    }
                }
            }

            if (
                "dbConfig" in app.configs
                // Allow power users to override licenseinfo page by creating a page with this name
                //app.pages["licenses"] === undefined
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
                    appID,
                    mdText: dbLicenseInfoMarkdown,
                    dialect: "eng_us", // XXX
                }

                loadedPages.push(licensePage);
            }

        });

        return new PageHandler(loadedPages, i18nHandler);
    }

    getPageIDs(): PageID[] {
        return Array.from(this.knownPageIDs);
    }

    getPagesForPageID(pageID: PageID): Map<AppID, LoadedPage> {
        // NOTE: inefficiency here, can be cached or the data structure can be rethought.
        const pagesForPageID = this.pages.filter((p) => p.pageID === pageID);

        if (pagesForPageID.length === 0) {
            console.info(this.pages);
            console.info({pageID});
            throw new Error(`Page not found: ${pageID}`);
        }
        else {
            const targetPages = new Map(pagesForPageID.map((p) => [p.appID, p]));
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
