import * as React from "react";
import ReactModal from "react-modal";
import Select from "react-select";
import type {Props as SelectProps} from "react-select";
import {KnownDialectID} from "../../common/generatedTypes";
import I18NHandler from "../../common/i18n/I18NHandler";
import {SearchBar} from "../components/SearchBar";
import AppConfig from "../configHandler/AppConfig";
import {ReturnedFinalConfig} from "../configHandler/zodConfigTypes";
import {RawDialect} from "../configHandler/zodLangConfigTypes";
import {ReactSelectOption} from "../types/ReactSelectHelpers";
import {getRecordEntries} from "../utils";

type SOAProps = {
    rfc: ReturnedFinalConfig,
    appConfig: AppConfig,
    dialectSwitcherVisible: boolean,
    currentDialectID: KnownDialectID,
    searchBarRef: React.RefObject<SearchBar>,
    closeSearchOptionsArea: () => void,
    i18nHandler: I18NHandler;
    onDialectSwitch: (dialectID: KnownDialectID) => void,
};

// TODO: internationalize this, or just always show default display name?
function dialectToReactSelectOption(dialectID: KnownDialectID, dialect: RawDialect): ReactSelectOption {
    return {label: dialect.displayName, value: dialectID};
}

export default class DialectSwitcher extends React.Component<SOAProps, Record<string, never>> {
    onDialectSwitchINTERNAL: SelectProps<ReactSelectOption>['onChange'] = (option, _) => {
        this.props.onDialectSwitch((option as ReactSelectOption).value);
    }

    render() {
        const {appConfig, currentDialectID, dialectSwitcherVisible, searchBarRef, closeSearchOptionsArea} = this.props;
        const {dialectHandler} = appConfig;

        const dialects = dialectHandler.getAllDialects();
        const dialectOptions = getRecordEntries(dialects).map(([dialectID, dialect]) => dialectToReactSelectOption(dialectID as KnownDialectID, dialect));

        const defaultDialectID = dialectHandler.getDefaultDialectID();
        const defaultDialect = dialectHandler.getDefaultDialect();
        const defaultDialectOption = dialectToReactSelectOption(defaultDialectID, defaultDialect);

        const selectedDialectOption = dialectToReactSelectOption(currentDialectID, dialectHandler.getDialect(currentDialectID));

        return <ReactModal
            contentLabel="Search Options"
            isOpen={dialectSwitcherVisible}
            //onAfterOpen={() => {this.dialectSelector.current?.shouldFocus.current?.focus()}}
            onRequestClose={closeSearchOptionsArea}
            onAfterClose={() => {searchBarRef.current?.textInput?.current?.focus()}}
            shouldCloseOnEsc={true}
            shouldFocusAfterRender={true}
        >
            <Select
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="bottom"
                value={selectedDialectOption}
                options={dialectOptions}
                defaultValue={defaultDialectOption}
                isSearchable={true}
                isClearable={false}
                isDisabled={false}
                onChange={this.onDialectSwitchINTERNAL}
                //ref={ref}
            />
        </ReactModal>
    }
}
