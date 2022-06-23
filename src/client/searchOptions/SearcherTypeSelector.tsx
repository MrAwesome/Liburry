import * as React from "react";
import I18NHandler from "../../common/i18n/I18NHandler";
import {ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {SearcherType} from "../search/searchers/Searcher";
import Select from "react-select";

import type {ReactSelectOption} from "../types/ReactSelectHelpers";

type STSProps = {
    rfc: ReturnedFinalConfig,
    currentSearcherType: SearcherType,
    handleSearcherTypeChange: (searcherType: SearcherType) => void,
    i18nHandler: I18NHandler;
};
type STSState = {};


export default class SearcherTypeSelector extends React.PureComponent<STSProps, STSState> {
    constructor(props: STSProps) {
        super(props);
        this.handleSearcherTypeChangeINTERNAL = this.handleSearcherTypeChangeINTERNAL.bind(this);
    }

    handleSearcherTypeChangeINTERNAL(option: ReactSelectOption | readonly ReactSelectOption[] | null, _: any) {
        //handleSearcherTypeChangeINTERNAL: SelectProps<ReactSelectOption>['onChange'] = (option, _) => {
        this.props.handleSearcherTypeChange((option as ReactSelectOption).value as SearcherType);
    }

    render() {
        const {currentSearcherType, i18nHandler} = this.props;
        const {tok} = i18nHandler;

        const allSearcherTypes = getAllSearcherTypes().map(objWithDisplayNameToReactSelectOption);

        const selected = objWithDisplayNameToReactSelectOption(searcherTypeToObjWithDisplayName(currentSearcherType));

        // TODO: clean up these CSS names.
        const obj = <div className="app-selector">
            <span className="app-selector-appname">{tok("select")}{tok("searcher_type")}:</span>

            <Select
                styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="bottom"
                defaultValue={allSearcherTypes[0]}
                value={selected}
                options={allSearcherTypes}
                isSearchable={true}
                isClearable={false}
                isDisabled={false}
                onChange={this.handleSearcherTypeChangeINTERNAL}
            />

        </div>;
        return obj;
    }
}

type STWithDisp = {searcherType: SearcherType, displayName: string};


function getAllSearcherTypes(): [STWithDisp, ...STWithDisp[]] {
    // TODO: return internationalized version of these names
    return Object.values(SearcherType).filter((st) => !st.startsWith('DISABLED_')).map(searcherTypeToObjWithDisplayName) as [STWithDisp, ...STWithDisp[]];
}

function searcherTypeToObjWithDisplayName(searcherType: SearcherType): STWithDisp {
    // TODO: return internationalized version of these names
    return {searcherType, displayName: searcherType};
}

function objWithDisplayNameToReactSelectOption(app: STWithDisp): ReactSelectOption {
    return {value: app.searcherType, label: app.displayName};
}
