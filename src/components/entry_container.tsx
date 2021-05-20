import * as React from "react";

import {SearchResultEntry} from '../types';

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

export class EntryContainer extends React.PureComponent<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            clicked: ClickedOrder.NORMAL,
        }
        this.myOnClick = this.myOnClick.bind(this);
        this.fadeClicked = this.fadeClicked.bind(this);
        this.resetClicked = this.resetClicked.bind(this);
        this.clickedNotif = this.clickedNotif.bind(this);
        this.createMatchElement = this.createMatchElement.bind(this);
        this.getAltTextContainers = this.getAltTextContainers.bind(this);
    }

    getEntry(): SearchResultEntry {
        return this.props.entry;
    }

    getClicked(): ClickedOrder {
        return this.state.clicked;
    }

    myOnClick(_: any) {
        // TODO: handle the case of being in a Chrome/Firefox desktop/mobile app
        const {pojUnicodeText} = this.getEntry();
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
        var altTextContainers = [];

        if (pojInput !== null) {
            const poji = this.createMatchElement(pojInput, "poj-input");
            const pojic = <div className="poj-input-container">
                ({poji})
            </div>;
            altTextContainers.push(pojic);
            if (pojNormalized !== null) {
                altTextContainers.push(<>&nbsp;</>);
            }
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
    createMatchElement(inputText: string, className: string) {
        const rawHtml = {__html: inputText};
        return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;

    }

    render() {
        const {pojUnicode, definition, hoabun, dbName} = this.getEntry();
        const clicked = this.getClicked();

        const poju = this.createMatchElement(pojUnicode, "poj-unicode");
        const hoab = this.createMatchElement(hoabun, "hoabun");
        const engl = this.createMatchElement(definition, "definition");

        return (
            // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
            <div className="entry-container" style={this.fadingStyle()} onClick={this.myOnClick}>
                <div className="alt-text-container">
                    {this.getAltTextContainers()}
                </div>

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

                <div className="dbname-container">
                    <div className="dbname">
                        {dbName}
                    </div>
                </div>

                {clicked ? this.clickedNotif() : null}
            </div>
        );
    };
}

