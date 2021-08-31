import * as React from "react";
import {MainDisplayAreaMode} from "../types/displayTypes";
import QueryStringHandler from "../QueryStringHandler";
import {REPO_LINK} from "../constants";
import {DBIdentifier} from "../types/config";

export class SearchBar extends React.PureComponent<any, any> {
    textInput: React.RefObject<any>;
    constructor(props: any) {
        super(props);
        this.textInput = React.createRef();
    }

    componentDidMount() {
        this.textInput.current.focus();
    }

    updateAndFocus(query: string) {
        this.textInput.current.value = query;
        this.textInput.current.focus();
    }

    render() {
        const {onChange, onSubmit} = this.props;
        return <>
            <div className="search-bar-container">
                <div className="search-bar">
                    <form onSubmit={onSubmit}>
                        <input
                            autoFocus
                            type="text"
                            ref={this.textInput}
                            placeholder="Search..."
                            onChange={onChange}
                        />
                    </form>
                    <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
                </div>
            </div>
            <div className="search-area-buffer" />
        </>
    }
}

export function DebugArea({loadedDBs}: {loadedDBs: Map<DBIdentifier, boolean>}) {
    return <div className="debug-area">
        <DBLoadedState loadedDBs={loadedDBs} />
    </div>
}

function DBLoadedState({loadedDBs}: {loadedDBs: Map<string, boolean>}) {
    let states: JSX.Element[] = [];
    loadedDBs.forEach((db, dbIdentifier) => {
        const isLoaded = (db === null) || (db === false);
        const loadedString = isLoaded ? "⌛" : "✅";
        const borderStyleColor = isLoaded ? "red" : "green";
        const backgroundColor = isLoaded ? "pink" : "white";
        const loadedStatusStyle = {
            "border": `1px ${borderStyleColor} solid`,
            "background": backgroundColor,
        };

        const entryDiv = <div className="db-loaded-entry" key={dbIdentifier} style={loadedStatusStyle} >
            <span className="db-loaded-entry-name">{dbIdentifier}: </span>
            <span className="db-loaded-entry-isloaded">
                {loadedString}
            </span>
        </div>;
        states.push(entryDiv);
    });
    return <div className="db-loaded-states">{states}</div>

}

const selectBarToMainModeMapping = new Map([
    ["Home", MainDisplayAreaMode.HOME],
    ["Settings", MainDisplayAreaMode.SETTINGS],
    ["Search", MainDisplayAreaMode.SEARCH],
    ["About", MainDisplayAreaMode.ABOUT],
    ["Contact", MainDisplayAreaMode.CONTACT],
]);
let queryStringHandler = new QueryStringHandler();

export class SelectBar extends React.PureComponent<any, any> {
    render() {
        let links: JSX.Element[] = [];
        selectBarToMainModeMapping.forEach((mode, str) => {
            const lam = (e: any) => {
                e.preventDefault();
                queryStringHandler.updateMode(mode);
            };
            links.push(
                <button onClick={lam}> {str} </button>
            );
        });
        return <div className="select-bar">{links}</div>
    }
}

// TODO: update link when repo name has been updated
export class AboutPage extends React.PureComponent<any, any> {
    render() {
        return <div className="page">
            <div className="page-header">ABOUT</div>
            <div className="page-content">
                <div className="about-container">
                    <div className="about">
                        <p>This website is powered by open source technology.</p>
                        <p>The code can be viewed here:<br />
                            <a href={REPO_LINK}>{REPO_LINK}</a>
                        </p>

                        <p>The databases used for search can all be found here, along with relevant licensing information:<br />
                            <a href="https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/">https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    }
}
