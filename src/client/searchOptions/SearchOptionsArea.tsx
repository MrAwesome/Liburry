import * as React from "react";
import ReactModal from "react-modal";
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
    searchBarRef: React.RefObject<SearchBar>
};

export default class SearchOptionsArea extends React.Component<SOAProps, {}> {
    appSelector: React.RefObject<AppSelector> = React.createRef();

    render() {
        const {rfc, appConfig, handleAppChange, handleSubAppChange, searchOptionsVisible, searchBarRef} = this.props;
        return <ReactModal
            contentLabel="Search Options"
            isOpen={searchOptionsVisible}
            onAfterOpen={() => {this.appSelector.current?.shouldFocus.current?.focus(); console.log("Fired", this.appSelector.current);} }
            onRequestClose={() => this.setState({searchOptionsVisible: false})}
            onAfterClose={() => searchBarRef.current?.textInput?.current?.focus()}

            >
                <AppSelector
                    ref={this.appSelector}
                    rfc={rfc}
                    currentAppID={appConfig.appID}
                    currentSubAppID={appConfig.subAppID}
                    handleAppChange={handleAppChange}
                    handleSubAppChange={handleSubAppChange}
                />
        </ReactModal>

    }
}
