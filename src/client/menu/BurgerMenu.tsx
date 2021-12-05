import * as React from "react";
import {slide as Menu, State as BurgerState} from 'react-burger-menu';
import type AppConfig from "../configHandler/AppConfig";
import {PageID} from "../configHandler/zodConfigTypes";
import "./burger.css";

interface BMenuProps {
    appConfig: AppConfig,
    loadPage: (pageID: PageID) => void,
    goHome: () => void,
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
        // TODO: instead of button, it should be a link - but one that just modifies the querystring
        return <button onClick={() => {
            this.closeMenu();
            this.props.goHome();
        }} className="menu-item">Home</button>;
    }

    handleStateChange (state: BurgerState) {
        this.setState({isOpen: state.isOpen})
    }

    closeMenu () {
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
            key={"menu-item-"+pageID} >
            {pageHandler.getLinkTitle(pageID)}
        </button>;
    }

    // TODO: generate from config (pass it in here)
    // TODO: keep state of current location to point at it

    render() {
        const pageHandler = this.props.appConfig.pageHandler;
        const pageIDs = pageHandler.getPageIDs();
        const pageLinks = pageIDs.map(this.makePageIDButton);

        return (
            <Menu
                right
                isOpen={this.state.isOpen}
                onStateChange={(state) => this.handleStateChange(state)}
                >
                {this.makeHomeButton()}
                {pageLinks}
                {this.makeSettingsButton()}
            </Menu>
                //<button onClick={this.showSettings} className="menu-item">Settings</button>
        );
    }
}