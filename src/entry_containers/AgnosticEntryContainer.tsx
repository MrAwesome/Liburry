import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import {AnnotatedDisplayReadyField, AnnotatedSearchResultEntry} from "../types/dbTypes";
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
    "matched_examples" |
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
            area("long_descriptions", ["explanation"]),
            area("examples", ["example", "example_phrase"]),
            area("matched_examples", ["matched_example"]),
        ]),
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
    static CSS_AREA_PREFIX = "agnostic-container";
    //
    // NOTE: for now, this is specific to the dictionary type
    static treeHandler = new LocationTreeHandler(AgnosticEntryContainer.CSS_AREA_PREFIX, agnosticDictionaryAreas);

    getEntry(): AnnotatedSearchResultEntry {
        return this.props.entry;
    }

    // TODO: also include score in debug mode (or actually show a pixel-size colorbar in main mode)
    render() {
        const treeHandler = AgnosticEntryContainer.treeHandler;
        const tree = treeHandler.generateEmptyTree();

        const entry = this.getEntry();

        const matchGroups: JSX.Element[][] = [];

        entry.getFields().forEach((field) => {
            const maybeDialect = field.getDialect();
            if (maybeDialect !== null) {
                if ((maybeDialect as string).trimEnd !== undefined) {
                    const singleDialect = maybeDialect as string;
                    // XXX TODO: use actual dialects from chosen options. this is a temporary restraining order against KIP.
                    if (singleDialect.match(/kip/)) {
                        return;
                    }
                } else if ((maybeDialect as string[]).flatMap !== undefined) {
                    const dialects = maybeDialect as string[];
                    //if (dialects.some(d => d.match(/kip/))) {
                    //    return;
                    //}
                }
                //if dialect?.contains("kip")

            }
            const maybeFieldType = field.getDataTypeForDisplayType("dictionary");
            if (field.hasValue() && maybeFieldType !== null) {
                const fieldType = maybeFieldType as RawDictionaryFieldDisplayType;
                const displayValue = field.getDisplayValue();
                const className = fieldType + "-element";

                // TODO: handle delimiters. can fuzzy search lists? should split only be here? that does not work well with </mark>...
                // TODO: XXX: find solution for matches
                const delim = field.getDelimiter();

                let element: JSX.Element;
                if (delim) {
                    // TODO: handle match elements that are delimited
                    const subvals = displayValue.split(delim).filter(x => x);
                    const elems = subvals.map((subval, i) => {
                        const val = makeElem(field, className, subval);
                        if (fieldType === "matched_example") {
                            if (matchGroups[i] === undefined) {
                                matchGroups[i] = [];
                            }
                            matchGroups[i].push(val);
                            return null;
                        }
                        return val;
                    });
                    element = <>{elems}</>;
                } else {
                    element = makeElem(field, className, displayValue);
                }

                const areas = treeHandler.getAreas(fieldType);

                // TODO: how can you add onclick/etc for the elements you create here?
                // TODO: can you have items inserted ["where", "they", "are", "in", "list"]

                treeHandler.insertInto(tree, fieldType, element);

            }
        });

        if (matchGroups.length > 0) {
            matchGroups.forEach((matchGroup, i) => {
                const prefix = (matchGroups.length > 1) ?
                    <div className="agnostic-matched-group-prefix">{i}.</div> :
                    null;
                const matchGroupContainer = <div className="agnostic-matched-group-container">
                    {prefix}
                    <div className="agnostic-matched-group">{matchGroup}</div>
                </div>;
                // NOTE: you can insert a container around x to have each match group display as a group
                treeHandler.insertInto(tree, "matched_example", matchGroupContainer)
                }
            );
        }

        // NOTE: should be displayname instead
        const TEMPdbid = entry.getDBIdentifier();
        const dbName = TEMPdbid.replace(/^ChhoeTaigi_/, "");
        treeHandler.insertInto(tree, "dbname", <div className="dbname-element">{dbName}</div>);

        return treeHandler.getAsNestedDivs(tree);
    }
}

function makeElem(field: AnnotatedDisplayReadyField, className: string, text: string): JSX.Element {
    // TODO: handle matching on delimited elements
    if (field.wasMatched()) {
        return createMatchElement(text, className);
    } else {
        return <div className={className}>{text}</div>;
    }
}
