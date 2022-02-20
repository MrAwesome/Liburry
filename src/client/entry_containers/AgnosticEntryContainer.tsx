import * as React from "react";
import {createMatchElement} from "../fuzzySortReactUtils";
import {AnnotatedDisplayReadyField, AnnotatedSearchResultEntry} from "../types/dbTypes";

// NOTE: this import feels wrong, likely too abstract / the display types maybe don't belong in this file
//       (separation of concerns)
import {FieldID, RawDictionaryFieldDisplayType} from "../configHandler/zodConfigTypes";

import "./AgnosticEntryContainer.css";
import {area, AreaNode, LocationTreeHandler} from "./utils";

// TODO(high): set up integration tests
// TODO: use FieldDisplayType/FieldDisplayRule to display everything
// TODO: set up display-specific options (vocabulary language/dialect (dialect should maybe be different?) and explanation language/dialect)

type AECProps = {
    debug: boolean,
    entry: AnnotatedSearchResultEntry,
    displayableFields: Set<FieldID>,
}

type AECDisplayArea =
    "container" |
    "debugbox" |
    "mainbox" |
    "titlebox" |
    "rightbox" |
    "title" |
    "title_other" |
    "title_alternate" |
    "title_alternate_other" |
    "title_prefix" |
    "definition" |
    "examples" |
    "matched_examples" |
    "long_definitions" |
    "main_other" |
    "dbname" |
    "vocab_metadata" |
    "debug_metadata";


// TODO: add these title strings to LANG_CONFIG
// TODO: more generic way of representing titles, and more language-agnostic way of displaying titles.
//       both can and probably should should live in yaml configs
//    The third field should be a token which will be resolved from yaml
const agnosticDictionaryAreas: AreaNode<AECDisplayArea, RawDictionaryFieldDisplayType> = area("container", [
    // TODO: only display in debug mode
    //area("debugbox", [
    //    area("debug_metadata", ["id"]),
    //    area("dbname", ["dbname"]),
    //]),
    area("mainbox", [
        //area("title_prefix", ["measure_word"]),
        area("titlebox", [
            area("title", ["vocab"]),
            area("title_other", ["vocab_other", "pronunciation"]), // TODO: handle pronunciation differently
            area("title_alternate", ["input", "normalized", "input_other", "normalized_other"]),
        ]),
        area("definition", ["definition"]),
        area("main_other", [
            area("long_definitions", ["long_definition"], "Explanations / Kái-Soeh / 解說"),
            area("examples", ["example", "example_phrase"], "Examples / Lē-Kù / 例句"),
            area("matched_examples", ["matched_example"], "Matched Examples / Sì-Thīn Lē-Kù / 四伨例句"),
        ]),
        //area("vocab_metadata", ["pos_classification"]),
    ]),
    //area("rightbox", [
    //]),
]);

// TODO: fix display of "examples" (they either stack with title using inline, or have full width borders with block (will require inserting a container around them)
// TODO: when pulling in from config file, only include matching display rules
// TODO: instead, field to display *rule*?
// TODO: decide how to display the name of a field, and any information about it

export default class AgnosticEntryContainer extends React.PureComponent<AECProps, {}> {
    static CSS_AREA_PREFIX = "agnostic-container";
    //
    // NOTE: for now, this is specific to the dictionary type
    static treeHandler = new LocationTreeHandler(AgnosticEntryContainer.CSS_AREA_PREFIX, agnosticDictionaryAreas);

    // TODO: also include score in debug mode (or actually show a pixel-size colorbar in main mode)
    render() {
        const treeHandler = AgnosticEntryContainer.treeHandler;
        const tree = treeHandler.generateEmptyTree();

        const {entry, displayableFields, debug} = this.props;
        const matchGroups: JSX.Element[][] = [];

        // Match tags instead
        entry.getFields().forEach((field) => {

            // Short-circuit fields we know we don't want to display.
            if (!displayableFields.has(field.getColumnName())) {
                return;
            }

            const maybeFieldType = field.getDataTypeForDisplayType("dictionary");
            if (field.hasValue() && maybeFieldType !== null) {
                const fieldType = maybeFieldType as RawDictionaryFieldDisplayType;

                const areas = treeHandler.getAreas(fieldType);

                // Don't include alt-text if it wasn't matched.
                // NOTE: if alt-text would be displayed elsewhere, this will need to be
                //       tweaked to allow it to appear there but not in title_alternate
                if (areas?.includes("title_alternate")) {
                    if (!field.wasMatched()) {
                        return;
                    }
                }

                const displayValue = field.getDisplayValue();

                // TODO: handle delimiters. can fuzzy search lists? should split only be here? that does not work well with </mark>...
                const delim = field.getDelimiter();

                let element: JSX.Element;
                if (!delim) {
                    element = makeElem(debug, field, fieldType, displayValue);
                } else {
                    const subvals = displayValue.split(delim).filter(x => x).map(x => x.trim());
                    const elems = subvals.map((subval, i) => {
                        const val = makeElem(debug, field, fieldType, subval, i.toString());
                        if (fieldType === "matched_example") {
                            if (matchGroups[i] === undefined) {
                                matchGroups[i] = [];
                            }
                            matchGroups[i].push(val);
                            return null;
                        }
                        return val;
                    }).filter(x => x !== null);
                    element = <React.Fragment key={fieldType + "-split-items"}>{elems}</React.Fragment>;
                }


                // TODO: how can you add onclick/etc for the elements you create here? (just create React elements and insert them)
                // TODO: can you have items inserted ["where", "they", "are", "in", "list"]

                treeHandler.insertInto(tree, fieldType, element);

            }
        });

        if (matchGroups.length > 0) {
            matchGroups.forEach((matchGroup) => {
                const prefix = !(matchGroups.length > 1) ? null :
                    <div className="agnostic-matched-group-prefix" key="matched-group-prefix"></div>;
                const matchGroupContainer =
                    <div className="agnostic-matched-group-container" key="matched-group-container">
                        {prefix}
                        <div className="agnostic-matched-group" key="matched-group">{matchGroup}</div>
                    </div>;
                treeHandler.insertInto(tree, "matched_example", matchGroupContainer)
            });
        }

        // NOTE: should be displayname instead
        const TEMPdbid = entry.getDBIdentifier();
        const dbName = TEMPdbid.replace(/^ChhoeTaigi_/, "");
        treeHandler.insertInto(tree, "dbname", <div className="dbname-element">{dbName}</div>);

        return treeHandler.getAsNestedDivs(tree, debug);
    }
}

function makeElem(debug: boolean, field: AnnotatedDisplayReadyField, fieldType: string, text: string, keyHelper?: string): JSX.Element {
    // TODO: handle matching on delimited elements
    const className = fieldType + "-element";
    let key = `${field.getColumnName()}-${field.getDialect()}`;
    if (keyHelper) {
        key = `${key}-${keyHelper}`;
    }

    const out = field.wasMatched()
        ? createMatchElement(text, className, key)
        : <div className={className} key={key}>{text}</div>;

    const dbg = debug
        ? <span className="dbg-field-info" key={"header-" + key}>[{key}]</span>
        : null;

    return <React.Fragment key={key}>
        {dbg}
        {out}
    </React.Fragment>
}
