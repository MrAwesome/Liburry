import * as React from "react";
import Select from "react-select";
import type {Props as SelectProps} from "react-select";
import {AppID, AppTopLevelConfiguration, ReturnedFinalConfig, SubAppID} from "../configHandler/zodConfigTypes";
import {getRecordEntries} from "../utils";

import "./AppSelector.css";

type SelectOption = {value: any, label: string};

// TODO: move to dynamic class version of rfc
function getAllApps(rfc: ReturnedFinalConfig): {appID: AppID, displayName: string}[] {
    return getRecordEntries(rfc.appConfigs).map(([appID, appConf]) => {
        const {displayName} = appConf.configs.appConfig.config;
        return {appID, displayName};
    });
}

function getKnownAppConfig(rfc: ReturnedFinalConfig, appID: AppID): AppTopLevelConfiguration {
    const appConf = rfc.appConfigs[appID];
    if (appConf === undefined) {
        throw new Error(`Attempted to load unknown appID: "${appID}"`);
    } else {
        return appConf;
    }
}

function getKnownApp(rfc: ReturnedFinalConfig, appID: AppID): {appID: AppID, displayName: string} {
    const appConf = getKnownAppConfig(rfc, appID);
    const {displayName} = appConf.configs.appConfig.config;
    return {appID, displayName};
}

function getSubApp(rfc: ReturnedFinalConfig, appID: AppID, subAppID: SubAppID | null): {subAppID: AppID, displayName: string} | null {
    if (subAppID === null) {
        return null;
    }
    const appConf = getKnownAppConfig(rfc, appID);
    const subApp = appConf.configs.appConfig.config.subApps?.[subAppID];

    if (subApp === undefined) {
        return null;
    }
    const {displayName} = subApp;

    return {subAppID, displayName};
}

function getAllSubAppsForApp(rfc: ReturnedFinalConfig, appID: AppID): {subAppID: SubAppID, displayName: string}[] | undefined {
    const subApps = getKnownAppConfig(rfc, appID).configs.appConfig.config.subApps;
    if (subApps === undefined) {
        return undefined;
    }

    return getRecordEntries(subApps).map(([subAppID, subAppConf]) => {
        const {displayName} = subAppConf;
        return {subAppID, displayName};
    });
}

function appToReactSelectOption(app: {appID: AppID, displayName: string}): SelectOption {
    return {value: app.appID, label: app.displayName};
}

function subAppToReactSelectOption(subApp: {subAppID: AppID, displayName: string}): SelectOption {
    return {value: subApp.subAppID, label: subApp.displayName};
}

function appSelectorHelper(
    options: SelectOption[],
    selected: SelectOption,
    onChange: SelectProps<SelectOption>['onChange'],
    ref: React.Ref<any> | undefined,
) {
    return <Select
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        menuPlacement="bottom"
        value={selected}
        options={options}
        defaultValue={options[0]}
        isSearchable={true}
        isClearable={false}
        isDisabled={false}
        onChange={onChange}
        ref={ref}
    />
}

type ASProps = {
    rfc: ReturnedFinalConfig,
    currentAppID: AppID,
    currentSubAppID: SubAppID | null,
    handleAppChange: (appID: AppID) => void,
    handleSubAppChange: (subAppID: SubAppID) => void,
};
type ASState = {};

export default class AppSelector extends React.PureComponent<ASProps, ASState> {
    shouldFocus: React.RefObject<HTMLElement> = React.createRef();

    constructor(props: ASProps) {
        super(props);
        this.handleAppChangeINTERNAL = this.handleAppChangeINTERNAL.bind(this);
        this.handleSubAppChangeINTERNAL = this.handleSubAppChangeINTERNAL.bind(this);
    }

    //handleAppChangeINTERNAL(option: SelectOption | readonly SelectOption[] | null, _: any) {
    handleAppChangeINTERNAL(option: any, _: any) {
        this.props.handleAppChange(option.value as AppID);
    }

    handleSubAppChangeINTERNAL(option: any, _: any) {
        this.props.handleSubAppChange(option.value as SubAppID);
    }

    render() {
        const {currentAppID, currentSubAppID, rfc} = this.props;

        let appSelector: JSX.Element | null = null;
        const allApps = getAllApps(rfc);
        if (allApps.length > 1) {
            const allAppDisplayVals = allApps.map(appToReactSelectOption);
            const selectedApp = appToReactSelectOption(getKnownApp(rfc, currentAppID));
            appSelector = appSelectorHelper(allAppDisplayVals, selectedApp, this.handleAppChangeINTERNAL, this.shouldFocus);
        }

        let subAppSelector: JSX.Element | null = null;

        const allSubApps = getAllSubAppsForApp(rfc, currentAppID);
        if (allSubApps !== undefined && allSubApps.length > 1) {
            const selectedSubAppRaw = getSubApp(rfc, currentAppID, currentSubAppID);
            const allSubAppDisplayVals = allSubApps.map(subAppToReactSelectOption);
            const selectedSubApp = (selectedSubAppRaw !== null) ? subAppToReactSelectOption(selectedSubAppRaw) : allSubAppDisplayVals[0];
            subAppSelector = appSelectorHelper(allSubAppDisplayVals, selectedSubApp, this.handleSubAppChangeINTERNAL, undefined);
        }

        const obj = <div className="app-selector"
        >
            {appSelector !== null ? <span>Select App:</span> : null}
            {appSelector}
            {subAppSelector !== null ? <span>Select SubApp:</span> : null}
            {subAppSelector}
        </div>;
        return obj;
    }
}
