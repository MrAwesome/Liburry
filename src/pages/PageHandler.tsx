import {AppID, LoadedPage, PageID, ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {getRecordEntries} from "../utils";

// TODO: method for sorting the combinedpages by some score (how does this work when combinedpages are defined separately? should they be defined all together?)

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
        const appIDs = [selectedAppID, "default"];

        const pageMaps = new Map();
        appIDs.forEach((appID) => {
            const app = finalConfig.apps[appID];

            if (app === undefined) {
                throw new Error(`App not found: ${appID}`);
            }

            const pageConfig = app.pages;
            const appPairs = getRecordEntries(pageConfig);
            appPairs.forEach(([pageID, loadedPage]) => {
                const thisPage = pageMaps.get(pageID);
                if (thisPage === undefined) {
                    pageMaps.set(pageID, new Map());
                }
                pageMaps.get(pageID).set(appID, loadedPage);
            });
        });

        return new PageHandler(pageMaps);
    }

    getPageIDs() {
        return Array.from(this.pages.keys());
    }

    getPagesForPageID(pageID: PageID) {
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
