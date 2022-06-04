import * as React from "react";
import Select, {components} from "react-select";
import type {Props as SelectProps} from "react-select";
import {KnownDialectID} from "../../common/generatedTypes";
import I18NHandler from "../../common/i18n/I18NHandler";
import AppConfig from "../configHandler/AppConfig";
import {RawDialect} from "../configHandler/zodLangConfigTypes";
import {ReactSelectOption} from "../types/ReactSelectHelpers";
import {getRecordEntries} from "../utils";
import {ReactComponent as DialectSwitchButtonTwoBubbles} from "../../icons/langswitchTwoBubbles.svg";

import "./DialectSwitcher.css";

const DropdownIndicator = (props: any) => {
    return (
        <components.DropdownIndicator {...props}>
            <div className="dialect-switcher-div">
                <DialectSwitchButtonTwoBubbles className="dialect-switcher" />
            </div>
        </components.DropdownIndicator>
    );
};


type SOAProps = {
    appConfig: AppConfig,
    currentDialectID: KnownDialectID,
    i18nHandler: I18NHandler;
    onDialectSwitch: (dialectID: KnownDialectID) => void,
};

// TODO: internationalize this, or just always show default display name?
function dialectToReactSelectOption(dialectID: KnownDialectID, dialect: RawDialect): ReactSelectOption {
    return {label: dialect.displayName, value: dialectID};
}

export default class DialectSwitcher extends React.PureComponent<SOAProps, Record<string, never>> {
    onDialectSwitchINTERNAL: SelectProps<ReactSelectOption>['onChange'] = (option, _) => {
        this.props.onDialectSwitch((option as ReactSelectOption).value);
    }

    render() {
        const {appConfig, currentDialectID} = this.props;
        const {dialectHandler} = appConfig;

        const dialects = dialectHandler.getAllDialects();
        const dialectOptions = getRecordEntries(dialects).map(([dialectID, dialect]) => dialectToReactSelectOption(dialectID as KnownDialectID, dialect));

        const defaultDialectID = dialectHandler.getDefaultDialectID();
        const defaultDialect = dialectHandler.getDefaultDialect();
        const defaultDialectOption = dialectToReactSelectOption(defaultDialectID, defaultDialect);

        const selectedDialectOption = dialectToReactSelectOption(currentDialectID, dialectHandler.getDialect(currentDialectID));

        return <Select
            styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
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

            components={{DropdownIndicator}}
        />
    }
}
