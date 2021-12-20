import * as React from "react";
import Select from "react-select";
import type {Props as SelectProps} from "react-select";
import {AppID, AppTopLevelConfiguration, ReturnedFinalConfig, SubAppID} from "./configHandler/zodConfigTypes";
import {getRecordEntries} from "./utils";

import "./AppSelector.css";

type ASProps = {
    rfc: ReturnedFinalConfig,
    currentAppID: AppID,
    currentSubAppID: SubAppID | undefined,
    handleAppChange: (appID: AppID) => void,
    handleSubAppChange: (subAppID: SubAppID) => void,
};
type ASState = {};

type SelectOption = {value: any, label: string};

// TODO: move to dynamic class version of rfc
function getAllApps(rfc: ReturnedFinalConfig): {appID: AppID, displayName: string}[] {
    return getRecordEntries(rfc.apps).map(([appID, appConf]) => {
        const {displayName} = appConf.configs.appConfig.config;
        return {appID, displayName};
    });
}

function getKnownAppConfig(rfc: ReturnedFinalConfig, appID: AppID): AppTopLevelConfiguration {
    const appConf = rfc.apps[appID];
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

function getSubApp(rfc: ReturnedFinalConfig, appID: AppID, subAppID: SubAppID | undefined): {subAppID: AppID, displayName: string} | undefined {
    if (subAppID === undefined) {
        return undefined;
    }
    const appConf = getKnownAppConfig(rfc, appID);
    const subApp = appConf.configs.appConfig.config.subApps?.[subAppID];

    if (subApp === undefined) {
        return undefined;
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

function appSelectorHelper(options: SelectOption[], selected: SelectOption, onChange: SelectProps<SelectOption>['onChange']) {
    return <Select
        value={selected}
        options={options}
        defaultValue={options[0]}
        isSearchable={true}
        isClearable={false}
        isDisabled={false}
        onChange={onChange}
    />
}

export default class AppSelector extends React.Component<ASProps, ASState> {
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
            appSelector = appSelectorHelper(allAppDisplayVals, selectedApp, this.handleAppChangeINTERNAL);
        }

        let subAppSelector: JSX.Element | null = null;

        const allSubApps = getAllSubAppsForApp(rfc, currentAppID);
        if (allSubApps !== undefined && allSubApps.length > 1) {
            const selectedSubAppRaw = getSubApp(rfc, currentAppID, currentSubAppID);
            const allSubAppDisplayVals = allSubApps.map(subAppToReactSelectOption);
            const selectedSubApp = (selectedSubAppRaw !== undefined) ? subAppToReactSelectOption(selectedSubAppRaw) : allSubAppDisplayVals[0];
            subAppSelector = appSelectorHelper(allSubAppDisplayVals, selectedSubApp, this.handleSubAppChangeINTERNAL);
        }

        const obj = <div className="app-selector">
            {appSelector}
            {subAppSelector}
        </div>;
        return obj;
    }
}
