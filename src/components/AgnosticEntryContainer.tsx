import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import FieldClassificationHandler from "../search/FieldClassificationHandler";
import {SearchResultEntry, SearchResultEntryData} from "../types/dbTypes";

type AECProps = {
    debug: boolean,
    //langOptions={langOptions}
    fieldHandler: FieldClassificationHandler,
    entryData: SearchResultEntryData,
}

const littleStyle = {fontSize: "10px", color: "grey"};

export default class AgnosticEntryContainer extends React.PureComponent<AECProps, {}> {
    entry: SearchResultEntry;

    constructor(props: any) {
        super(props);
        this.entry = SearchResultEntry.from(this.props.entryData);

    }

    getEntry(): SearchResultEntry {
        return this.entry;
    }

    // TODO: also include score in debug mode (or actually show a pixel-size colorbar in main mode)
    render() {
        const {fieldHandler} = this.props;

        const entry = this.getEntry();

        const output = [];
        output.push(<div style={littleStyle}> DB: {entry.getDBFullName()} </div>);
        entry.getFields().forEach((field) => {
            if (field.value || field.displayValOverride) {
                const colName = field.colName;
                const fieldType = fieldHandler.getTypeOfField(entry.getDBFullName(), colName);
                const elem = createMatchElement(field.displayValOverride ?? field.value, "agnostic-field-"+fieldType);
                // XXX TODO: clean up and use CSS
                output.push(
                    <div>&nbsp;&nbsp;
                    <span style={littleStyle}>{colName}&nbsp;({fieldType}):&nbsp;&nbsp;</span> 
                    {elem}
                </div>);
            }
        });
        output.push(<br />);
        return output;
    }
}
