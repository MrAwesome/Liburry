import * as React from "react";
import {SearchContext} from "../search/orchestration/SearchValidityManager";
import {AllDBLoadStats} from "../types/dbTypes";
import "./style.css";

export const PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH = 300;

// TODO(wishlist): progressbar for each DB, in a flexbox constellation
// TODO(wishlist): color-coded DBs, with loading bar color matching a color on the entrycontainer, and a bar for each db

export class ProgressHandler {
    numConfigsToLoad = 0;
    numConfigsLoaded = 0;

    private progress = {
        config: 0,
        dbDownload: 0,
        dbParsed: 0,
        dbLoad: 0,
        search: 0,
    }

    private shouldShow = {
        config: true,
        dbLoad: true,
        search: false,
    }

    constructor(
        private genUpdateDisplay: () => Promise<void>
    ) {
        this.getBars = this.getBars.bind(this);
        this.shouldShowProgressBars = this.shouldShowProgressBars.bind(this);
        this.genUpdateDisplayForConfigEvent = this.genUpdateDisplayForConfigEvent.bind(this);
        this.genUpdateDisplayForDBLoadEvent = this.genUpdateDisplayForDBLoadEvent.bind(this);
        this.genUpdateDisplayForSearchEvent = this.genUpdateDisplayForSearchEvent.bind(this);
    }

    shouldShowProgressBars(): boolean {
        return (this.shouldShow.config || this.shouldShow.dbLoad || this.shouldShow.search);
    }

    getBars(parentElem: React.RefObject<HTMLElement> | undefined): JSX.Element {
        const shouldShow = this.shouldShowProgressBars();
        const scaleY = shouldShow ? 1 : 0;

        //const maxHeight = `${shouldShow ? 4 : 0}px`;
        //const height = maxHeight;
        //

        const {config,dbLoad} = this.shouldShow;
        const progressBars = [
            config ? makeProgressBar("chhaConfigBar", this.progress.config) : null,
            dbLoad ? makeProgressBar("chhaDBDownloadBar", this.progress.dbDownload) : null,
            dbLoad ? makeProgressBar("chhaDBParsedBar", this.progress.dbParsed) : null,
            dbLoad ? makeProgressBar("chhaDBLoadBar", this.progress.dbLoad) : null,
            makeProgressBar("chhaSearchBar", this.progress.search),
        ];

        return <div className="loadingBarContainer" style={{
            //transform: `scaleY(${scaleY})`,
            opacity: `${scaleY * 100}%`,
            //height,
            width: parentElem?.current?.clientWidth
            }}>
            <>{progressBars}</>
        </div>
    }

    async genUpdateDisplayForConfigEvent() {
        const percent = this.numConfigsLoaded / this.numConfigsToLoad || 0;
        this.progress.config = percent;
        this.genUpdateDisplay();

        if (this.numConfigsToLoad <= 0 || percent >= 1) {
            setTimeout(() => {
                this.shouldShow.config = false;
                this.genUpdateDisplay();
            }, PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH);
        }
    }

    // NOTE: this should be generalized (each DB having its own display area?) such that
    //       new display events don't need code changes here
    async genUpdateDisplayForDBLoadEvent(dbStats: AllDBLoadStats | {didReload: true}) {
        // NOTE: this should maybe be another function, or something more generic
        if ("didReload" in dbStats) {
            this.progress.dbDownload = 0;
            this.progress.dbParsed = 0;
            this.progress.dbLoad = 0;
            this.shouldShow.dbLoad = true;
            this.genUpdateDisplay();
            return;
        }
        const {numDownloaded, numParsed, numLoaded, numDBs} = dbStats;

        const percentDownloaded = (numDownloaded / numDBs) || 0;
        const percentParsed = (numParsed / numDBs) || 0;
        const percentLoaded = (numLoaded / numDBs) || 0;

        this.progress.dbDownload = percentDownloaded;
        this.progress.dbParsed = percentParsed;
        this.progress.dbLoad = percentLoaded;
        this.genUpdateDisplay();

        if (numDBs <= 0 || percentLoaded >= 1) {
            setTimeout(() => {
                this.shouldShow.dbLoad = false;
                this.genUpdateDisplay();
            }, PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH);
        }
    }

    async genUpdateDisplayForSearchEvent(searchContext: SearchContext | null) {
        if (searchContext === null) {
            this.progress.search = 0;
            this.shouldShow.search = false;
            this.genUpdateDisplay();
            return;
        }

        this.shouldShow.search = true;

        const [completedDBs, totalDBs] = searchContext.getCompletedAndTotal();
        const percent = completedDBs / totalDBs || 0;

        this.progress.search = percent;
        this.genUpdateDisplay();

        if (totalDBs <= 0 || percent >= 1) {
            setTimeout(() => {
                this.shouldShow.search = false;
                this.genUpdateDisplay();
            }, PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH);
        }
    }
}

export class ProgressBar extends React.PureComponent<{
    elementID: string,
    percentProgress: number,
}, {}> {
    render() {
        const {percentProgress, elementID} = this.props;

        const widthPercent100 = Math.min(percentProgress * 100, 100);

        const minDuration = 0.2;
        const maxAdditionalDuration = 0.4;
        const widthDuration = minDuration + (maxAdditionalDuration * (1 - (widthPercent100 / 100)));

        return <div
            className="loadingBar"
            id={elementID}
            style={{
                //transform: `scaleX(${widthPercent100}%)`,
                // NOTE: we animate width instead of height here, because width does not cause issues with border-radius.
                width: `${widthPercent100}%`,
                transitionDuration: `${widthDuration}s`,
            }}
            key={elementID}
        />;
    }
}

function makeProgressBar(elementID: string, percentProgress: number) {
    return <ProgressBar
        key={elementID}
        elementID={elementID}
        percentProgress={percentProgress}
    />
}
