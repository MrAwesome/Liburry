import * as React from "react";
import {LoadedDBsMap} from "../ChhaTaigi";
import {SearchContext} from "../SearchValidityManager";

export const PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH = 200;
export const PROGRESS_BARS_HEIGHT = "4px";

// TODO(wishlist): color-coded DBs, with loading bar color matching a color on the entrycontainer,
//                 and a bar for each db


export class ProgressHandler {
    numConfigsToLoad = 0;
    numConfigsLoaded = 0;

    configProgress = 0;
    dbLoadProgress = 0;
    searchProgress = 0;
    configShouldShow = true;
    dbLoadShouldShow = true;
    searchShouldShow = false;

    constructor(private updateDisplay: () => void) {
        this.getBars = this.getBars.bind(this);
        this.updateDisplayForConfigEvent = this.updateDisplayForConfigEvent.bind(this);
        this.updateDisplayForDBLoadEvent = this.updateDisplayForDBLoadEvent.bind(this);
        this.updateDisplayForSearchEvent = this.updateDisplayForSearchEvent.bind(this);
    }

    reset() {
        this.numConfigsToLoad = 0;
        this.numConfigsLoaded = 0;

        this.configProgress = 0;
        this.dbLoadProgress = 0;
        this.searchProgress = 0;
        this.configShouldShow = false;
        this.dbLoadShouldShow = false;
        this.searchShouldShow = false;
    }

    getBars(): JSX.Element {
        const height =
            (this.configShouldShow || this.dbLoadShouldShow || this.searchShouldShow)
                ? PROGRESS_BARS_HEIGHT : "0px";

        return <div className="loadingBarContainer" style={{height}}>
            <ProgressBar
                shouldShow={this.configShouldShow}
                percentProgress={this.configProgress}
                elementID="chhaConfigBar" />
            <ProgressBar
                shouldShow={this.dbLoadShouldShow}
                percentProgress={this.dbLoadProgress}
                elementID="chhaDBLoadBar" />
            <ProgressBar
                shouldShow={this.searchShouldShow}
                percentProgress={this.searchProgress}
                elementID="chhaSearchBar" />
        </div>;
    }

    updateDisplayForConfigEvent() {
        const percent = this.numConfigsLoaded / this.numConfigsToLoad || 0;
        this.configProgress = percent;
        this.updateDisplay();

        if (this.numConfigsToLoad <= 0 || percent >= 1) {
            setTimeout(() => {
                this.configShouldShow = false;
                this.updateDisplay();
            }, PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH);
        }
    }

    updateDisplayForDBLoadEvent(loadedDBs: LoadedDBsMap) {
        let numLoaded = 0;
        let numTotal = 0;

        // If you really want to nitpick CPU cycles, this can be stored on LoadedDBsMap
        loadedDBs.forEach((isLoaded, _name) => {
            numTotal += 1;
            if (isLoaded) {
                numLoaded += 1;
            }
        });

        const percent = (numLoaded / numTotal) || 0;
        this.dbLoadProgress = percent;
        this.updateDisplay();

        if (numTotal <= 0 || percent >= 1) {
            setTimeout(() => {
                this.dbLoadShouldShow = false;
                this.updateDisplay();
            }, PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH);
        }
    }

    updateDisplayForSearchEvent(searchContext: SearchContext | null) {
        if (searchContext === null) {
            this.searchShouldShow = false;
            return;
        }

        this.searchShouldShow = true;

        const [completedDBs, totalDBs] = searchContext.getCompletedAndTotal();
        const percent = completedDBs / totalDBs || 0;

        this.searchProgress = percent;
        this.updateDisplay();

        if (totalDBs <= 0 || percent >= 1) {
            setTimeout(() => {
                this.searchShouldShow = false;
                this.updateDisplay();
            }, PROGRESS_BAR_HEIGHT_ANIMATION_LENGTH);
        }
    }
}

export class ProgressBar extends React.PureComponent<{
    percentProgress: number,
    elementID: string,
    shouldShow: boolean,
    //durationMs: number,
}, {}> {
    render() {
        const {percentProgress, elementID} = this.props;
        const widthPercent = Math.min(percentProgress * 100, 100);
        const style: React.CSSProperties = {
                width: `${widthPercent}%`,
        };

        const minDuration = 0.2;
        const maxAdditionalDuration = 0.4;
        const widthDuration = minDuration + (maxAdditionalDuration * (1 - (widthPercent / 100)));
        style.transitionDuration = `${widthDuration}s`;

        return <div
            id={elementID}
            className="loadingBar"
            style={style}
            key={elementID}
        />;
    }
}
