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
    "debugbox" |
    "mainbox" |
    "rightbox" |
    "title" |
    "title_other" |
    "title_alternate" |
    "title_alternate_other" |
    "title_prefix" |
    "definition" |
    "examples" |
    "long_descriptions" |
    "main_other" |
    "dbname" |
    "vocab_metadata" |
    "debug_metadata";

const agnosticDictionaryAreas: AreaNode<AECDisplayArea, RawDictionaryFieldDisplayType> = area("container", [
    // TODO: only display in debug mode
    //area("debugbox", [
    //    area("debug_metadata", ["id"]),
    //    area("dbname", ["dbname"]),
    //]),
    area("mainbox", [
        //area("title_prefix", ["measure_word"]),
        area("title", ["vocab"]),
        area("title_other", ["vocab_other"]),
        area("definition", ["definition"]),
        area("main_other", [
            area("long_descriptions",
                ["explanation"]),
            area("examples",
                ["example", "example_phrase"])]),
        //area("vocab_metadata", ["pos_classification"]),
    ]),
    area("rightbox", [
        area("title_alternate", ["input", "normalized", "input_other", "normalized_other"]),
    ]),
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

                const areas = treeHandler.getAreas(fieldType);
                console.log(fieldType, areas);

                // TODO: handle delimiters. can fuzzy search lists? should split only be here? that does not work well with </mark>...
                // TODO: how can you add onclick/etc for the elements you create here?
                // TODO: can you have items inserted ["where", "they", "are", "in", "list"]

                treeHandler.insertInto(tree, fieldType, element);

            }
        });

        // NOTE: should be displayname instead
        const TEMPdbid = entry.getDBIdentifier();
        const dbName = TEMPdbid.replace(/^ChhoeTaigi_/, "");
        treeHandler.insertInto(tree, "dbname", <span className="dbname-element">{dbName}</span>);

        return treeHandler.getAsNestedDivs(tree);
    }
}
