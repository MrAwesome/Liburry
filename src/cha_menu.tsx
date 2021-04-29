import * as React from "react";
import {slide as Menu} from "react-burger-menu";

export class ChaMenu extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            currentResultsElements: [],
            searchableDicts: [],
            ongoingSearches: [],
        };

        this.showSettings = this.showSettings.bind(this);
    }

    showSettings(event: any) {
        event.preventDefault();
        // TODO: show some settings
        // TODO: determine how to store them in localstorage (for now)
    }

    render() {
      return <Menu right>
        <a id="about" className="menu-item" href="/about">About</a>
        <a id="contact" className="menu-item" href="/contact">Contact</a>
        <a onClick={ this.showSettings } className="menu-item--small" href="">Settings</a>
      </Menu>;
    }
}
