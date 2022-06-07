import * as React from "react";
import {slide as Menu, State as BurgerState} from 'react-burger-menu';
import type AppConfig from "../configHandler/AppConfig";
import {PageID} from "../configHandler/zodConfigTypes";
import "./burger.css";

import {ReactComponent as SettingsIcon} from "../../icons/settings.svg";
import {ReactComponent as SettingsCloseIcon} from "../../icons/settingsClose.svg";
import {VisibleMenu} from "../ChhaTaigi";
import DialectSwitcher from "../dialects/DialectSwitcher";
import {KnownDialectID} from "../../generated/i18n";
import I18NHandler from "../../common/i18n/I18NHandler";

interface BMenuProps {
    appConfig: AppConfig,
    loadPage: (pageID: PageID) => void,
    goHome: () => void,
    toggleVisibleMenu: (targetMenu: VisibleMenu) => void,
    currentDialectID: KnownDialectID,
    i18nHandler: I18NHandler;
    onDialectSwitch: (dialectID: KnownDialectID) => void,
}

interface BMenuState {
    isOpen: boolean,
}

export class BurgerMenu extends React.Component<BMenuProps, BMenuState> {
    constructor(props: BMenuProps) {
        super(props);

        this.state = {
            isOpen: false,
        }

        this.closeMenu = this.closeMenu.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.makeHomeButton = this.makeHomeButton.bind(this);
        this.makeSettingsButton = this.makeSettingsButton.bind(this);
        this.makePageIDButton = this.makePageIDButton.bind(this);
        this.showSettings = this.showSettings.bind(this);
    }

    showSettings(event: React.MouseEvent) {
        event.preventDefault();
        this.closeMenu();
    }

    makeSettingsButton() {
        // XXX TODO
        //return <button onClick={this.showSettings} className="menu-item">Settings</button>;
        return null;
    }

    makeHomeButton() {
        const {tok} = this.props.i18nHandler;
        // TODO: instead of button, it should be a link - but one that just modifies the querystring
        return <button onClick={() => {
            this.closeMenu();
            this.props.goHome();
        }} className="menu-item">{tok("pages/home")}</button>;
    }

    handleStateChange(state: BurgerState) {
        this.setState({isOpen: state.isOpen})
    }

    closeMenu() {
        this.setState({isOpen: false})
    }

    makePageIDButton(pageID: string) {
        const pageHandler = this.props.appConfig.pageHandler;
        return <button
            className="menu-item"
            onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                this.closeMenu();
                this.props.loadPage(pageID);
            }}
            key={"menu-item-" + pageID} >
            {pageHandler.getLinkTitle(pageID)}
        </button>;
    }

    // TODO: generate from config (pass it in here)
    // TODO: keep state of current location to point at it

    render() {
        const {appConfig} = this.props;
        const pageHandler = appConfig.pageHandler;
        const pageIDs = pageHandler.getPageIDs();
        const pageLinks = pageIDs.map(this.makePageIDButton);

        // TODO: only show dialect menu if more than one language is detected
        return (
            <Menu
                right
                isOpen={this.state.isOpen}
                onStateChange={(state) => this.handleStateChange(state)}
                customBurgerIcon={<SettingsIcon className="liburry-settings-icon" />}
                customCrossIcon={<SettingsCloseIcon className="liburry-settings-close-icon" />}
            >
                {this.makeHomeButton()}
                {pageLinks}
                {this.makeSettingsButton()}
                <DialectSwitcher
                    appConfig={appConfig}
                    i18nHandler={this.props.i18nHandler}
                    currentDialectID={this.props.currentDialectID}
                    onDialectSwitch={this.props.onDialectSwitch}
                />
            </Menu>
        );
    }
}
