import * as React from "react";

// TODO: determine if this import breaks one of Uncle Bob's rules
import {SearchableDict} from './types';

enum clickedOrder {
    NORMAL,
    CLICKED,
    FADING,
}

const CLICKED_STYLE = {
    "background": "#FFD586",
    "border": "1px solid lightgrey",
    "boxShadow": "1px 1px 4px 2px rgba(0, 0, 0, 0.2)",
};

const FADING_STYLE = {
    "transition": "all 1s ease-out",
}


export class EntryContainer extends React.PureComponent<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            clicked: clickedOrder.NORMAL,
        }
        this.myOnClick = this.myOnClick.bind(this);
        this.fadeClicked = this.fadeClicked.bind(this);
        this.resetClicked = this.resetClicked.bind(this);
        this.clickedNotif = this.clickedNotif.bind(this);
        this.createMatchElement = this.createMatchElement.bind(this);
        this.getAltTextContainers = this.getAltTextContainers.bind(this);
    }

    myOnClick(_: any) {
        // TODO: handle the case of being in a Chrome/Firefox desktop/mobile app
        navigator.clipboard.writeText(this.props.pojUnicodeText);
        this.setState({clicked: clickedOrder.CLICKED});
        setTimeout(this.fadeClicked, 500);
    }

    fadeClicked() {
        this.setState({clicked: clickedOrder.FADING});
        setTimeout(this.resetClicked, 500);
    }

    resetClicked() {
        this.setState({clicked: clickedOrder.NORMAL});
    }

    clickedNotif() {
        return <div className="clicked-notif">Copied POJ to clipboard!</div>;
    }

    fadingStyle(): object {
        const {clicked} = this.state;
        switch (clicked) {
            case clickedOrder.CLICKED:
                return CLICKED_STYLE;
            case clickedOrder.FADING:
                return FADING_STYLE;
            default:
                return {};
        }
    }

    getAltTextContainers(): JSX.Element[] {
        const {pojNormalized, pojInput} = this.props;
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

    createMatchElement(inputText: string, className: string) {
        const rawHtml = {__html: inputText};
        return <span className={className} dangerouslySetInnerHTML={rawHtml}></span>;

    }

    render() {
        // TODO: make strongly-typed
        const {pojUnicode, english, hoabun} = this.props;
        const {clicked} = this.state;
        // FIXME(https://github.com/farzher/fuzzysort/issues/66)

        const poju = this.createMatchElement(pojUnicode, "poj-unicode");
        const hoab = this.createMatchElement(hoabun, "hoabun");
        const engl = this.createMatchElement(english, "english-definition");

        // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
        return (
            // TODO: just change style, instead of changing className
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

                <div className="english-container">
                    {engl}
                </div>

                {clicked ? this.clickedNotif() : null}
            </div>
        );
    };
}

export class ResultsArea extends React.PureComponent<any, any> {
    render() {
        const {results} = this.props;
        return <div className="results-container">
            {results}
        </div>;
    }
}

export class SearchBar extends React.Component<any, any> {
    textInput: React.RefObject<any>;
    constructor(props: any) {
        super(props);
        this.textInput = React.createRef();
    }

    componentDidMount() {
        this.textInput.current.focus();
    }

    render() {
        const {onChange} = this.props;
        return <div className="search-bar">
            <input
                autoFocus
                type="text"
                ref={this.textInput}
                placeholder="Search..."
                onChange={onChange} />
            <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
        </div>
    }
}

function DBLoadedState({loadedDBs}: {loadedDBs: Map<string, SearchableDict>}) {
    var states: JSX.Element[] = [];
    loadedDBs.forEach((db, dbName) => {
        const isLoaded = (db === null);
        const loadedString = isLoaded ? "⌛" : "✅";
        const borderStyleColor = isLoaded ? "red" : "green";
        const borderStyle = {"border": "1px " + borderStyleColor + " solid"};

        console.log(borderStyle);
        const entryDiv = <div className="db-loaded-entry" key={dbName} style={borderStyle} >
                <span className="db-loaded-entry-name">{dbName}: </span>
                <span className="db-loaded-entry-isloaded">
                {loadedString}
                </span>
            </div>;
        states.push(entryDiv);
    });
    return <div className="db-loaded-states">{states}</div>

}

export function DebugArea({loadedDBs}: {loadedDBs: Map<string, SearchableDict>}) {
    return <div className="debug-area">
        <DBLoadedState loadedDBs={loadedDBs} />
    </div>
}
