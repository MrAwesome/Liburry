import * as React from "react";

import {REPO_LINK} from "../constants";
import {createMatchElement} from "../fuzzySortReactUtils";
import {getMaxScore, SearcherType} from "../search";
import {AnnotatedSearchResultEntry} from "../types/dbTypes";

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

interface EntryContainerProps {
    debug: boolean,
    entry: AnnotatedSearchResultEntry,
}

interface EntryContainerState {
    clicked: ClickedOrder,
}

export default class EntryContainer extends React.PureComponent<EntryContainerProps, EntryContainerState> {
    constructor(props: EntryContainerProps) {
        super(props);
        this.state = {
            clicked: ClickedOrder.NORMAL,
        }

        this.clickedNotif = this.clickedNotif.bind(this);
        this.fadeClicked = this.fadeClicked.bind(this);
        this.getAltTextContainers = this.getAltTextContainers.bind(this);
        this.getRowIdentifier = this.getRowIdentifier.bind(this);
        this.getSearchScore = this.getSearchScore.bind(this);
        this.myOnClick = this.myOnClick.bind(this);
        this.resetClicked = this.resetClicked.bind(this);
        this.clickReport = this.clickReport.bind(this);
    }

    getEntry(): AnnotatedSearchResultEntry {
        return this.props.entry;
    }

    getClicked(): ClickedOrder {
        return this.state.clicked;
    }

    myOnClick(e: React.MouseEvent) {
        e.preventDefault();

        const pojUnicode = this.getEntry().getFieldByNameDEPRECATED("PojUnicode");
        // TODO: wrap in a try/catch for situations where clipboard isn't accessible (http, etc)
        if (pojUnicode) {
            navigator.clipboard.writeText(pojUnicode.getOriginalValue());
        }

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
        const altTextFields = ["PojInput", "PojNormalized"];
        let altTextContainers: JSX.Element[] = [];

        altTextFields.forEach((fieldName) => {
            const field = this.getEntry().getFieldByNameDEPRECATED(fieldName);
            const inner = field !== null ? createMatchElement(field.getDisplayValue(), "alt-text") : null;
            const container = <div className="alt-text-container" key={fieldName}>
                ({inner})
            </div>;
            altTextContainers.push(container);
        });

        return altTextContainers;
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

    getRowIdentifier(): JSX.Element {
        const rowID = this.getEntry().getRowID();

        return <div className="rowid-container">
            ID:&nbsp;
            <div className="rowid">
                {rowID}
            </div>
        </div>

    }


    clickReport(e: React.MouseEvent) {
        e.preventDefault();

        const dbName = this.getEntry().getDBIdentifier();
        const rowID = this.getEntry().getRowID();
        const pojUnicode = this.getEntry().getFieldByNameDEPRECATED("PojUnicode");
        const pojUnicodeText = pojUnicode!.getOriginalValue();
        const pojUnicodeCSV = pojUnicodeText.replace(/"/g, '""');
        const csvReportSkeleton = `"${dbName}","${rowID}","${pojUnicodeCSV}",`;
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

            {this.getRowIdentifier()}
        </div>
    }

    render() {
        const {debug} = this.props;
        const entry = this.getEntry();
        const dbIdentifier = entry.getDBIdentifier();
        const dbName = dbIdentifier.replace(/^ChhoeTaigi_/, "");

        const pojUnicode = entry.getFieldByNameDEPRECATED("PojUnicode");
        const definition = entry.getFieldByNameDEPRECATED("EngBun");
        const hoabun = entry.getFieldByNameDEPRECATED("HoaBun");
        const pojUnicodePossibleMatch = pojUnicode?.getDisplayValue() ?? null;
        const definitionPossibleMatch = definition?.getDisplayValue() ?? null;
        const hoabunPossibleMatch = hoabun?.getDisplayValue() ?? null;

        const clicked = this.getClicked();

        const poju = pojUnicodePossibleMatch !== null ? createMatchElement(pojUnicodePossibleMatch, "poj-unicode") : null;
        const hoab = hoabunPossibleMatch !== null ? createMatchElement(hoabunPossibleMatch, "hoabun") : null;
        const engl = definitionPossibleMatch !== null ? createMatchElement(definitionPossibleMatch, "definition") : null;

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
