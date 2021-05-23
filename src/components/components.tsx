import * as React from "react";

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
        const {onChange} = this.props;
        return <>
        <div className="search-bar">
            <input
                autoFocus
                type="text"
                ref={this.textInput}
                placeholder="Search..."
                onChange={onChange} />
            <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
        </div>
        <div className="search-area-buffer" />
        </>
    }
}

function DBLoadedState({loadedDBs}: {loadedDBs: Map<string, boolean>}) {
    let states: JSX.Element[] = [];
    loadedDBs.forEach((db, dbName) => {
        const isLoaded = (db === null) || (db === false);
        const loadedString = isLoaded ? "⌛" : "✅";
        const borderStyleColor = isLoaded ? "red" : "green";
        const backgroundColor = isLoaded ? "pink" : "white";
        const loadedStatusStyle = {
            "border": `1px ${borderStyleColor} solid`,
            "background": backgroundColor,
        };

        const entryDiv = <div className="db-loaded-entry" key={dbName} style={loadedStatusStyle} >
            <span className="db-loaded-entry-name">{dbName}: </span>
            <span className="db-loaded-entry-isloaded">
                {loadedString}
            </span>
        </div>;
        states.push(entryDiv);
    });
    return <div className="db-loaded-states">{states}</div>

}

export function DebugArea({loadedDBs}: {loadedDBs: Map<string, boolean>}) {
    return <div className="debug-area">
        <DBLoadedState loadedDBs={loadedDBs} />
    </div>
}

export function AboutPage() {
    return <div className="about-container">
        <div className="about">
            To see information about the databases used in this website, visit here: https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/
        </div>
    </div>
}
