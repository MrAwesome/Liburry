import * as React from "react";
import OptionsChangeableByUser from "../ChhaTaigiOptions";
import AppConfig from "../configHandler/AppConfig";
import {DBIdentifier} from "../configHandler/zodConfigTypes";
import AgnosticEntryContainer from "../entry_containers/AgnosticEntryContainer";
import {AnnotatedSearchResultEntry, DBColName} from "../types/dbTypes";
import {AgGridReact} from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export enum SearchResultsDisplayMode {
    AGNOSTIC = "AGNOSTIC",
    DEBUG_DUMP = "DEBUG_DUMP",
}

interface ResultsDisplayProps {
    entries: AnnotatedSearchResultEntry[],
    options: OptionsChangeableByUser,
    appConfig: AppConfig,
}

export default class ResultsDisplay extends React.Component<ResultsDisplayProps, {}> {
    render(): JSX.Element | JSX.Element[] {
        const {searchResultsDisplayMode} = this.props.options;
        switch (searchResultsDisplayMode) {
            case SearchResultsDisplayMode.AGNOSTIC:
                return this.agnosticEntryContainer();
            case SearchResultsDisplayMode.DEBUG_DUMP:
                return this.debugDump();
        }
    }

    agnosticEntryContainer() {
        const {entries, options, appConfig} = this.props;
        const entryContainers = entries.map((entry) => {
            const dbConfig = appConfig.dbConfigHandler.getConfig(entry.getDBIdentifier());
            const displayableFields = dbConfig?.getDisplayableFieldIDs() ?? new Set();
            return <AgnosticEntryContainer
                debug={options.debug}
                entry={entry}
                displayableFields={displayableFields}
                key={entry.getDisplayKey()} />
        });

        return <>{entryContainers}</>;
    }

    debugDump() {
        const {entries} = this.props;

        const dbIDsToColumnsAndEntries: Map<DBIdentifier, [Set<DBColName>, AnnotatedSearchResultEntry[]]> = new Map();
        entries.forEach((entry) => {
            const dbID = entry.getDBIdentifier();
            if (!dbIDsToColumnsAndEntries.has(dbID)) {
                dbIDsToColumnsAndEntries.set(dbID, [new Set(), []])
            }

            const [dbColSet, dbEntries] = dbIDsToColumnsAndEntries.get(dbID)!;

            entry.getFields().forEach((field) => {
                dbColSet.add(field.getColumnName());
            });

            dbEntries.push(entry);
        });

        const tables: JSX.Element[] = [];

        dbIDsToColumnsAndEntries.forEach(([dbColSet, dbEntries], dbID) => {
            const dbCols = Array.from(dbColSet);
            const columnDefs = dbCols.map((dbCol) => ({field: dbCol}));
            
            //const header = <tr><>{dbCols.map((key) => <th>{key}</th>)}</></tr>

            const rowData = dbEntries.map((entry) => {
                const fields = entry.getFields();

                const data: Record<string, string> = {};

                fields.forEach((field) => {
                    const colName = field.getColumnName();

                    const text = field.getOriginalValue();
                    //const val = field.wasMatched()
                        //? createMatchElement(text, className, key)
                        //: <span className={className} key={key}>{text}</span>;

                    data[colName] = text;
                });
                return data;
            });

            const table =

            <span>
                <h2>{dbID}</h2>
                <div className="ag-theme-alpine">
                    <AgGridReact rowData={rowData} columnDefs={columnDefs} domLayout='autoHeight'></AgGridReact>
                </div>
            </span>
            tables.push(table);
        });
        return <>{tables}</>;
    }
}
