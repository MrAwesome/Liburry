import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import {AnnotatedSearchResultEntry} from "../types/dbTypes";
import {RawDictionaryFieldDisplayType} from "../types/displayTypes";

import "./AgnosticEntryContainer.css";
import {area, AreaNode, LocationTreeHandler} from "./utils";

// TODO(high): set up integration tests
// TODO: use FieldDisplayType/FieldDisplayRule to display everything
// TODO: set up display-specific options (vocabulary language/dialect (dialect should maybe be different?) and explanation language/dialect)

type AECProps = {
    debug: boolean,
    entry: AnnotatedSearchResultEntry,
}

type AECDisplayArea =
    "container" |
    "title" |
    "title_alt_display" |
    "title_alt_search" |
    "definition" |
    "examples" |
    "long_descriptions" |
    "main_other" |
    "metadata";

const agnosticDictionaryAreas: AreaNode<AECDisplayArea, RawDictionaryFieldDisplayType> = area("container", [
    area("title", ["vocab"]) as AreaNode<AECDisplayArea, RawDictionaryFieldDisplayType>,
    area("title_alt_display", []),
    area("title_alt_search", []),
    area("definition", ["definition"]),
    area("main_other", [
        area("long_descriptions",
            ["explanation"]),
        area("examples",
            ["example", "example_phrase"])]),
    area("metadata", ["id"]),
]);

// TODO: when pulling in from config file, only include matching display rules
// TODO: instead, field to display *rule*?

export default class AgnosticEntryContainer
    extends React.PureComponent<AECProps, {}>
{
    static CSS_PREFIX = "agnostic-container";
    //
    // NOTE: for now, this is specific to the dictionary type
    static treeHandler = new LocationTreeHandler(AgnosticEntryContainer.CSS_PREFIX, agnosticDictionaryAreas);

    constructor(props: AECProps) {
        super(props);
    }

    getEntry(): AnnotatedSearchResultEntry {
        return this.props.entry;
    }

    // TODO: also include score in debug mode (or actually show a pixel-size colorbar in main mode)
    render() {
        const treeHandler = AgnosticEntryContainer.treeHandler;
        const tree = treeHandler.generateEmptyTree();

        const entry = this.getEntry();

        entry.getFields().forEach((field) => {
            const maybeFieldType = field.getDataTypeForDisplayType("dictionary");
            if (field.hasValue() && maybeFieldType !== null) {
                const fieldType = maybeFieldType as RawDictionaryFieldDisplayType;
                const value = field.getDisplayValue();
                const className = fieldType + "-element";
                let element: JSX.Element;
                if (field.wasMatched()) {
                    element = createMatchElement(value, className);
                } else {
                    element = <span className={className}>{value}</span>
                }
                treeHandler.insertInto(tree, fieldType, element);

                //const colName = field.getColumnName();
                // const displayArea = this.fieldDisplayTypeToDisplayRule(fieldType);
                // const cssPrefix = AgnosticEntryContainer.CSS_PREFIX + "-" + displayArea;

                // // TODO XXX : if a YAML config implements RawDictionaryFieldDisplayType -> whatever the more abstract version of AECDisplayArea is, it automatically can be displayed using AEC or any other
                // // TODO: order of areas should be pre-determined, since they're known at typing time? should they be? or should areas be defined in yaml and just have e.g. "other_info" "bottom" "priority: 0" or whatever?

                // if (displayArea !== null) {
                //     // TODO: more strongly type language
                //     const dialect = field.getDialect();

                //     // TODO: don't do this for non-matched elems
                //     let element;
                //     if (field.wasMatched()) {
                //         element = createMatchElement(field.getDisplayValue(), cssPrefix + "-element");
                //     } else {
                //         element = <span className={cssPrefix + "-element"}>{field.getDisplayValue()}</span>
                //     }

                //     let area = displayContainer.get(displayArea) ?? [];
                //     displayContainer.set(displayArea, [...area, element]);
                // }
            }
        });
        return treeHandler.getAsNestedDivs(tree);
//        // Example
//        let output: JSX.Element[] = [];
//        displayContainer.forEach((elementList, displayArea) => {
//            output.push(<div className={AgnosticEntryContainer.CSS_PREFIX + "-" + displayArea}>{elementList}</div>);
//        });
//        return <div className={AgnosticEntryContainer.CSS_PREFIX}>{output}</div>;
    }
}
