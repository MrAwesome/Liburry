import * as React from "react";
import OptionsChangeableByUser from "../ChhaTaigiOptions";
import AppConfig from "../configHandler/AppConfig";
import AgnosticEntryContainer from "../entry_containers/AgnosticEntryContainer";
import {AnnotatedSearchResultEntry} from "../types/dbTypes";

export enum SearchResultsDisplayMode {
    AGNOSTIC = "AGNOSTIC",
}

interface ResultsDisplayProps {
    entries: AnnotatedSearchResultEntry[],
    options: OptionsChangeableByUser,
    appConfig: AppConfig,
}

export default class ResultsDisplay extends React.Component<ResultsDisplayProps, {}> {
    render() {
        const {searchResultsDisplayMode} = this.props.options;
        switch (searchResultsDisplayMode) {
            case SearchResultsDisplayMode.AGNOSTIC:
                return this.agnosticEntryContainer();
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
}
