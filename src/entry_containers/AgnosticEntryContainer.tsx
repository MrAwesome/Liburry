import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import FieldClassificationHandler, {DBLangType} from "../search/FieldClassificationHandler";
import {SearchResultEntry} from "../types/dbTypes";
import {DictionaryFieldDisplayType, HasFieldDisplayTypeToAreaMapping} from "../types/displayTypes";
import {FieldTypeToAreaConverter} from "./utils";

import "./AgnosticEntryContainer.css";

// TODO(high): set up integration tests
// TODO: use FieldDisplayType/FieldDisplayRule to display everything
// TODO: set up display-specific options (vocabulary language/dialect (dialect should maybe be different?) and explanation language/dialect)

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
    null;

// TODO: codify these areas to appear in particular order, etc

// TODO: move this to YAML
const fieldTypeToDisplayArea: Array<[DictionaryFieldDisplayType, AECDisplayArea]> = [
    ["vocab", "title"],
    ["definition", "definition"],
    ["example", "other_info"],
    ["example_phrase", "other_info"],
];

// TODO: when pulling in from config file, only include matching display rules
// TODO: instead, field to display *rule*?

export default class AgnosticEntryContainer
    extends React.PureComponent<AECProps, {}>
    implements HasFieldDisplayTypeToAreaMapping<DictionaryFieldDisplayType, AECDisplayArea>
{

    static CSS_PREFIX = "agnostic-container";
    static fieldTypeToDisplayAreaConverter = new FieldTypeToAreaConverter(fieldTypeToDisplayArea);
    constructor(props: AECProps) {
        super(props);
    }

    fieldDisplayTypeToDisplayRule(fieldDisplayType: DictionaryFieldDisplayType): AECDisplayArea {
        return AgnosticEntryContainer.fieldTypeToDisplayAreaConverter.getArea(fieldDisplayType);
    }

    getEntry(): SearchResultEntry {
        return this.props.entry;
    }

    // TODO: also include score in debug mode (or actually show a pixel-size colorbar in main mode)
    render() {
        const entry = this.getEntry();

        let displayContainer: Map<AECDisplayArea, JSX.Element[]> = new Map();

        //output.push(<div style={littleStyle}> DB: {entry.getDBFullName()} </div>);
        entry.getFields().forEach((field) => {
            if (field.hasValue()) {
                const colName = field.getColumnName();
                const fieldType = field.getDataType() as DictionaryFieldDisplayType; // TODO: type this upstream
                const displayArea = this.fieldDisplayTypeToDisplayRule(fieldType);
                const cssPrefix = AgnosticEntryContainer.CSS_PREFIX + "-" + displayArea;

                // TODO XXX : if a YAML config implements DictionaryFieldDisplayType -> whatever the more abstract version of AECDisplayArea is, it automatically can be displayed using AEC or any other
                // TODO: order of areas should be pre-determined, since they're known at typing time? should they be? or should areas be defined in yaml and just have e.g. "other_info" "bottom" "priority: 0" or whatever?

                if (displayArea !== null) {
                    // TODO: more strongly type language
                    const language = field.getLanguage();

                    // TODO: don't do this for non-matched elems
                    let element;
                    if (field.wasMatched()) {
                        element = createMatchElement(field.getDisplayValue(), cssPrefix + "-element");
                    } else {
                        element = <span className={cssPrefix + "-element"}>{field.getDisplayValue()}</span>
                    }

                    let area = displayContainer.get(displayArea) ?? [];
                    displayContainer.set(displayArea, [...area, element]);
                }
            }
        });
        // Example
        //this.props.fieldHandler.getFieldsOfType(entry, "normalized").forEach((f) => output.push(f.getDisplayValue()));
        let output: JSX.Element[] = [];
        displayContainer.forEach((elementList, displayArea) => {
            output.push(<div className={AgnosticEntryContainer.CSS_PREFIX + "-" + displayArea}>{elementList}</div>);
        });
        return <div className={AgnosticEntryContainer.CSS_PREFIX}>{output}</div>;
    }
}
