import * as React from "react";

enum clickedOrder {
    NORMAL,
    CLICKED,
    FADING,
}

const CLICKED_STYLE = {
    "background": "#FFD586",
    "border": "1px solid lightgrey",
    "box-shadow": "1px 1px 4px 2px rgba(0, 0, 0, 0.2)",
};

const FADING_STYLE = {
    "transition": "background 1s ease-out",
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

    render() {
        const {pojUnicode, pojNormalized, english, hoabun} = this.props;
        const {clicked} = this.state;
        // FIXME(https://github.com/farzher/fuzzysort/issues/66)
        const htmlPojUnicode = {__html: pojUnicode};
        const htmlPojNormalized = {__html: pojNormalized};
        const htmlEnglish = {__html: english};
        const htmlHoabun = {__html: hoabun};
        const poju = <span className="poj-unicode" dangerouslySetInnerHTML={htmlPojUnicode}></span>;
        const pojn = <span className="poj-normalized" dangerouslySetInnerHTML={htmlPojNormalized}></span>;
        const engl = <span className="english-definition" dangerouslySetInnerHTML={htmlEnglish}></span>;
        const hoab = <span className="hoabun" dangerouslySetInnerHTML={htmlHoabun}></span>;

        // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
        return (
            // TODO: just change style, instead of changing className
            <div className="entry-container" style={this.fadingStyle()} onClick={this.myOnClick}>
                <div className="poj-normalized-container">
                    {pojn}
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


export class Placeholder extends React.PureComponent<any, any> {
    render() {
        const {text} = this.props;
        return <div className="placeholder">{text}</div>;
    }
}
const loadingPaceholder = <Placeholder text="Loading..." />;
const loadedPlaceholder = <Placeholder text="Type to search!" />;
const searchingPlaceholder = <Placeholder text="Searching..." />;
const noResultsPlaceholder = <Placeholder text="No results found!" />;

export class PlaceholderArea extends React.PureComponent<any, any> {
    render() {
        const {query, loaded, searching, numResults} = this.props;

        var placeholder = null;
        if (!numResults) {
            if (searching) {
                placeholder = searchingPlaceholder;
            } else {
                if (query) {
                    placeholder = noResultsPlaceholder;
                } else {
                    placeholder = loaded ? loadedPlaceholder : loadingPaceholder;
                }
            }
        }

        return <div className="placeholder-container">
            {placeholder}
        </div>
    }
}


export class ResultsArea extends React.PureComponent<any, any> {
    render() {
        const {results} = this.props;
        return <div className="results-container">
            {results}
        </div>;
    }
}

export class SearchBar extends React.PureComponent<any, any> {
    render() {
        const {onChange} = this.props;
        return <div className="search-bar">
            <input autoFocus={true} placeholder="Search..." onChange={onChange} />
            <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
        </div>
    }
}

