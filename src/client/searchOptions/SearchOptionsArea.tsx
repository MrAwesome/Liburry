import * as React from "react";
import ReactModal from "react-modal";
import I18NHandler from "../../common/i18n/I18NHandler";
import {SearchBar} from "../components/SearchBar";
import AppConfig from "../configHandler/AppConfig";
import {AppID, ReturnedFinalConfig, SubAppID} from "../configHandler/zodConfigTypes";
import AppSelector from "./AppSelector";

type SOAProps = {
    rfc: ReturnedFinalConfig,
    appConfig: AppConfig,
    handleAppChange: (appID: AppID) => void,
    handleSubAppChange: (subAppID: SubAppID) => void,
    searchOptionsVisible: boolean,
    searchBarRef: React.RefObject<SearchBar>,
    closeSearchOptionsArea: () => void,
    i18nHandler: I18NHandler;
};

export default class SearchOptionsArea extends React.Component<SOAProps, Record<string, never>> {
    appSelector: React.RefObject<AppSelector> = React.createRef();

    render() {
        const {rfc, appConfig, handleAppChange, handleSubAppChange, searchOptionsVisible, searchBarRef, closeSearchOptionsArea} = this.props;
        return <ReactModal
            contentLabel="Search Options"
            isOpen={searchOptionsVisible}
            onAfterOpen={() => {this.appSelector.current?.shouldFocus.current?.focus()}}
            onRequestClose={closeSearchOptionsArea}
            onAfterClose={() => {searchBarRef.current?.textInput?.current?.focus()}}
            shouldCloseOnEsc={true}
            shouldFocusAfterRender={true}
        >
            <AppSelector
                ref={this.appSelector}
                rfc={rfc}
                currentAppID={appConfig.appID}
                currentSubAppID={appConfig.subAppID}
                handleAppChange={handleAppChange}
                handleSubAppChange={handleSubAppChange}
                i18nHandler={this.props.i18nHandler}
            />
        </ReactModal>

    }
}
