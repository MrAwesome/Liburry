import DOMPurify from "dompurify";
import * as React from "react";

import {REPO_LINK} from "../constants";
import {getMaxScore, SearcherType} from "../search";
import FieldClassificationHandler from "../search/FieldClassificationHandler";
import {SearchResultEntry, SearchResultEntryData} from "../types/dbTypes";

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

export default class EntryContainer extends React.PureComponent<{
    debug: boolean,
    entryData: SearchResultEntryData,
    fieldHandler: FieldClassificationHandler,
}
, any> {

    entry: SearchResultEntry;
    constructor(props: any) {
        super(props);
        this.state = {
            clicked: ClickedOrder.NORMAL,
        }

        this.entry = SearchResultEntry.from(this.props.entryData);
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
        return this.entry;
    }

    getClicked(): ClickedOrder {
        return this.state.clicked;
    }

    myOnClick(e: React.MouseEvent) {
        e.preventDefault();

        const pojUnicode = this.getEntry().getFieldByNameDEPRECATED("poj_unicode");
        // TODO: wrap in a try/catch for situations where clipboard isn't accessible (http, etc)
        navigator.clipboard.writeText(pojUnicode!.value);
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
        const {fieldHandler} = this.props;
        const altTextFields = fieldHandler.getAltTextsINCOMPLETE(this.getEntry());
        let altTextContainers: JSX.Element[] = [];

        altTextFields.forEach((field) => {
            if (field.matched) {
                const inner = this.createMatchElement(field.displayValOverride ?? field.value, "alt-text");
                const container = <div className="alt-text-container">
                    ({inner})
                </div>;
                altTextContainers.push(container);
            }
        });

        return altTextContainers;
    }

    createMatchElement(inputText: string, className: string): JSX.Element {
        // NOTE: https://github.com/farzher/fuzzysort/issues/66
        var clean = DOMPurify.sanitize(inputText, {ALLOWED_TAGS: ['mark']});
        const rawHtml = {__html: clean};
        return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;

    }

    // TODO: unit test the scoring color selection logic, move somewhere further away
    getSearchScore(): JSX.Element {
        const dbSearchRanking = this.getEntry().getRanking();

        let score = dbSearchRanking.score;
        const max = getMaxScore(dbSearchRanking.searcherType);

        let green = 0;
        let red = 0;
        const colorAmplitude = (score / max) * 255;
        const inverseColorAmp = 255 - colorAmplitude;
        switch (dbSearchRanking.searcherType) {
            case SearcherType.LUNR:
                green = colorAmplitude;
                red = inverseColorAmp;
            break;
            case SearcherType.FUZZYSORT:
                red = colorAmplitude;
                green = inverseColorAmp;
            break;
        }

        const style = {"color": `rgb(${red}, ${green}, 0)`};

        return <div className="searchscore-container">
            Score:&nbsp;
            <div className="searchscore" style={style}>
                {score.toFixed(4)}
            </div>
        </div>
    }

    getDBID(): JSX.Element {
        const dbID = this.getEntry().getDBID();

        return <div className="dbid-container">
            ID:&nbsp;
            <div className="dbid">
                {dbID}
            </div>
        </div>

    }


    clickReport(e: React.MouseEvent) {
        e.preventDefault();

        const dbName = this.getEntry().getDBName();
        const dbID = this.getEntry().getDBID();
        const pojUnicode = this.getEntry().getFieldByNameDEPRECATED("poj_unicode");
        const pojUnicodeText = pojUnicode!.value;
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
        const dbName = this.getEntry().getDBName();

        const pojUnicode = this.getEntry().getFieldByNameDEPRECATED("poj_unicode");
        const definition = this.getEntry().getFieldByNameDEPRECATED("english");
        const hoabun = this.getEntry().getFieldByNameDEPRECATED("hoabun");
        const pojUnicodePossibleMatch = pojUnicode!.displayValOverride ?? pojUnicode!.value;
        const definitionPossibleMatch = definition!.displayValOverride ?? definition!.value;
        const hoabunPossibleMatch = hoabun!.displayValOverride ?? hoabun!.value;
        const clicked = this.getClicked();

        const poju = this.createMatchElement(pojUnicodePossibleMatch, "poj-unicode");
        const hoab = this.createMatchElement(hoabunPossibleMatch, "hoabun");
        const engl = this.createMatchElement(definitionPossibleMatch, "definition");

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
                    <div className="all-alt-text-container">
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
