import * as React from "react";

import {REPO_LINK} from "../constants";
import {FUZZY_SCORE_LOWER_THRESHOLD} from "../searchSettings";
import {SearchResultEntry} from "../types";

enum ClickedOrder {
    NORMAL,
    CLICKED,
    FADING,
}

const CLICKED_STYLE = {
    //"background": "#FFD586",
    "background": "#aaaaaa",
    //"transform": "rotate3d(2, -1, -1, -0.2turn)",
    "transition": "all 1s ease",
    "borderRadius": "5px",
};

const FADING_STYLE = {
    "transition": "all 1s ease",
    //"transform": "perspective(400px) translate3d(0em, 0em, -60px)",
}

export default class EntryContainer extends React.PureComponent<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            clicked: ClickedOrder.NORMAL,
        }
        this.clickedNotif = this.clickedNotif.bind(this);
        this.createMatchElement = this.createMatchElement.bind(this);
        this.fadeClicked = this.fadeClicked.bind(this);
        this.getAltTextContainers = this.getAltTextContainers.bind(this);
        this.getDBID = this.getDBID.bind(this);
        this.getSearchScore = this.getSearchScore.bind(this);
        this.myOnClick = this.myOnClick.bind(this);
        this.resetClicked = this.resetClicked.bind(this);
        this.clickReport = this.clickReport.bind(this);
    }

    getEntry(): SearchResultEntry {
        return this.props.entry;
    }

    getClicked(): ClickedOrder {
        return this.state.clicked;
    }

    myOnClick(e: React.MouseEvent) {
        e.preventDefault();

        const {pojUnicodeText} = this.getEntry();
        // TODO: wrap in a try/catch for situations where clipboard isn't accessible (http, etc)
        navigator.clipboard.writeText(pojUnicodeText);
        this.setState({clicked: ClickedOrder.CLICKED});
        setTimeout(this.fadeClicked, 500);
    }

    fadeClicked() {
        this.setState({clicked: ClickedOrder.FADING});
        setTimeout(this.resetClicked, 500);
    }

    resetClicked() {
        this.setState({clicked: ClickedOrder.NORMAL});
    }

    clickedNotif() {
        return <div className="clicked-notif">Copied POJ to clipboard!</div>;
    }

    fadingStyle(): object {
        const clicked = this.getClicked();
        switch (clicked) {
            case ClickedOrder.CLICKED:
                return CLICKED_STYLE;
            case ClickedOrder.FADING:
                return FADING_STYLE;
            default:
                return {};
        }
    }

    getAltTextContainers(): JSX.Element[] {
        const {pojNormalized, pojInput} = this.getEntry();
        let altTextContainers = [];

        if (pojInput !== null) {
            const poji = this.createMatchElement(pojInput, "poj-input");
            const pojic = <div className="poj-input-container">
                ({poji})
            </div>;
            altTextContainers.push(pojic);
        }

        if (pojNormalized !== null) {
            const pojn = this.createMatchElement(pojNormalized, "poj-normalized");
            const pojnc = <div className="poj-normalized-container">
                ({pojn})
                </div>;
            altTextContainers.push(pojnc);
        }

        return altTextContainers;
    }

    // FIXME(https://github.com/farzher/fuzzysort/issues/66)
    createMatchElement(inputText: string, className: string): JSX.Element {
        const rawHtml = {__html: inputText};
        return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;

    }

    // TODO: remove reliance on fuzzysort
    getSearchScore(): JSX.Element {
        const {dbSearchRanking} = this.getEntry();

        const score = dbSearchRanking;
        const worst = FUZZY_SCORE_LOWER_THRESHOLD;
        const green = (1 - (score / worst)) * 255;
        const red = (score / worst) * 255;
        const style = {"color": `rgb(${red}, ${green}, 0)`};

        return <div className="searchscore-container">
            Score:&nbsp;
            <div className="searchscore" style={style}>
                {score}
            </div>
        </div>
    }


    getDBID(): JSX.Element {
        const {dbID} = this.getEntry();

        return <div className="dbid-container">
            ID:&nbsp;
            <div className="dbid">
                {dbID}
            </div>
        </div>

    }


    clickReport(e: React.MouseEvent) {
        e.preventDefault();

        const {dbName,dbID,pojUnicodeText} = this.getEntry();
        const pojUnicodeCSV = pojUnicodeText.replace(/"/g, '""');
        const csvReportSkeleton = `"${dbName}","${dbID}","${pojUnicodeCSV}",`;
        navigator.clipboard.writeText(csvReportSkeleton).then(() =>
            window.open(`${REPO_LINK}/edit/main/misc/incorrect_entries.csv`)
        );

        e.stopPropagation();
    }

    getDebugBox(): JSX.Element {
        return <div className="entry-debugbox">
            {this.getSearchScore()}

            <button className="report-button" onClick={this.clickReport}>
                Report
            </button>

            {this.getDBID()}
        </div>
    }

    render() {
        const {debug} = this.props;
        const {pojUnicode, definition, hoabun, dbName} = this.getEntry();
        const clicked = this.getClicked();

        const poju = this.createMatchElement(pojUnicode, "poj-unicode");
        const hoab = this.createMatchElement(hoabun, "hoabun");
        const engl = this.createMatchElement(definition, "definition");


        return (
            // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
            <div className="entry-container" style={this.fadingStyle()} onClick={this.myOnClick}>
                {debug ? this.getDebugBox() : null}

                <div className="entry-mainbox">
                    <span className="poj-unicode-container">
                        {poju}
                    </span>
                    &nbsp;
                    <div className="hoabun-container">
                        ({hoab})
                    </div>

                    <div className="definition-container">
                        {engl}
                    </div>
                </div>

                <div className="entry-sidebox">
                    <div className="alt-text-container">
                        {this.getAltTextContainers()}
                    </div>

                    <div className="dbname-container">
                        <div className="dbname">
                            {dbName}
                        </div>
                    </div>
                </div>

                {clicked ? this.clickedNotif() : null}
            </div>
        );
    };
}
