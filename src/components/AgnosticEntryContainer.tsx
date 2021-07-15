import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import FieldClassificationHandler from "../search/FieldClassificationHandler";
import {SearchResultEntry} from "../types/dbTypes";

type AECProps = {
    debug: boolean,
    //langOptions={langOptions}
    fieldHandler: FieldClassificationHandler,
    entry: SearchResultEntry,
}

const littleStyle = {fontSize: "10px", color: "grey"};

export default class AgnosticEntryContainer extends React.PureComponent<AECProps, {}> {
    constructor(props: any) {
        super(props);

    }

    getEntry(): SearchResultEntry {
        return this.props.entry;
    }

    // TODO: also include score in debug mode (or actually show a pixel-size colorbar in main mode)
    render() {
        const entry = this.getEntry();

        const output = [];
        output.push(<div style={littleStyle}> DB: {entry.getDBFullName()} </div>);
        entry.getFields().forEach((field) => {
            if (field.hasValue()) {
                const colName = field.getColumnName();
                const fieldType = field.getDataType();
                const elem = createMatchElement(field.getDisplayValue(), "agnostic-field-"+fieldType);
                // XXX TODO: clean up and use CSS
                output.push(
                    <div>&nbsp;&nbsp;
                    <span style={littleStyle}>{colName}&nbsp;({fieldType}):&nbsp;&nbsp;</span>
                    {elem}
                </div>);
            }
        });
        // Example
        //this.props.fieldHandler.getFieldsOfType(entry, "normalized").forEach((f) => output.push(f.getDisplayValue()));
        output.push(<br />);
        return output;
    }
}
