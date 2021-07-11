import * as React from "react";
import FieldClassificationHandler from "../search/FieldClassificationHandler";
import type {SearchResultEntry} from "../types/dbTypes";

type AECProps = {
    debug: boolean,
    //langOptions={langOptions}
    fieldHandler: FieldClassificationHandler,
    entry: SearchResultEntry,
}

export default class AgnosticEntryContainer extends React.PureComponent<AECProps, {}> {
    render() {
        const {entry, debug, fieldHandler} = this.props;

        return <div>
            debug: {debug}

        </div>;
    }
}
