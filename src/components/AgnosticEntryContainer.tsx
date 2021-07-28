import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import FieldClassificationHandler, {DBLangType} from "../search/FieldClassificationHandler";
import {SearchResultEntry} from "../types/dbTypes";
import {DictionaryFieldDisplayType, HasFieldDisplayTypeToAreaMapping} from "../types/displayTypes";

// TODO: use FieldDisplayType/FieldDisplayRule to display everything

type AECProps = {
    debug: boolean,
    lang: DBLangType,
    //langOptions={langOptions}
    fieldHandler: FieldClassificationHandler,
    entry: SearchResultEntry,
}

type AECDisplayArea =
    "title" |
    "title_alt_display" |
    "title_alt_search" |
    "definition" |
    "other_info" |
    "metadata" |
    "debug_metadata" |
    "disabled";

// TODO: when pulling in from config file, only include matching display rules
// TODO: instead, field to display *rule*?
function fieldToArea(field: DictionaryFieldDisplayType): AECDisplayArea {
    switch (field) {
        case "base_phrase":
            return "disabled";
        case "channel_name":
            return "disabled";
        case "class":
            return "disabled";
        case "contributor":
            return "disabled";
        case "date_YYYY.MM.DD":
            return "disabled";
        case "definition":
            return "disabled";
        case "example":
            return "disabled";
        case "example_phrase":
            return "disabled";
        case "explanation":
            return "disabled";
        case "id":
            return "disabled";
        case "input":
            return "disabled";
        case "input_other":
            return "disabled";
        case "link":
            return "disabled";
        case "matched_example":
            return "disabled";
        case "measure_word":
            return "disabled";
        case "normalized":
            return "disabled";
        case "opposite":
            return "disabled";
        case "other":
            return "disabled";
        case "other_input":
            return "disabled";
        case "page_number":
            return "disabled";
        case "pos_classification":
            return "disabled";
        case "see_also":
            return "disabled";
        case "synonym":
            return "disabled";
        case "type":
            return "disabled";
        case "UNKNOWN":
            return "disabled";
        case "vocab":
            return "title";
        case "vocab_other":
            return "disabled";
    }

}


const littleStyle = {fontSize: "10px", color: "grey"};

export default class AgnosticEntryContainer
    extends React.PureComponent<AECProps, {}>
    implements HasFieldDisplayTypeToAreaMapping<DictionaryFieldDisplayType, AECDisplayArea>
{
    constructor(props: any) {
        super(props);

    }

    fieldDisplayTypeToDisplayRule(fieldDisplayType: DictionaryFieldDisplayType): AECDisplayArea {
        return fieldToArea(fieldDisplayType);
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
                const elem = createMatchElement(field.getDisplayValue(), "agnostic-field-" + fieldType);
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
