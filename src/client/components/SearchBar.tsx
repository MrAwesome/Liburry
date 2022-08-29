import * as React from "react";
import {BurgerMenu} from "../menu/BurgerMenu";
import {PageID} from "../configHandler/zodConfigTypes";
import {VisibleMenu} from "../ChhaTaigi";
import {isMobileDevice} from "../utils";

import type AppConfig from "../configHandler/AppConfig";

import {ReactComponent as EmptyMagGlass} from "../../icons/magGlassEmpty.svg";
import {ReactComponent as SettingsSliders} from "../../icons/settingsSliders.svg";
import {ReactComponent as SearchClickableClearSearch} from "../../icons/x.svg";
import "./SearchBar.css";
import {KnownDialectID} from "../../generated/i18n";
import I18NHandler from "../../common/i18n/I18NHandler";

interface SearchBarProps {
    appConfig: AppConfig,
    searchQuery(query: string, opts?: {isFromUserTyping: boolean}): Promise<void>,
    clearQuery: () => void,
    getNewestQuery(): string,
    loadPage: (pageID: PageID) => void,
    goHome: () => void,
    toggleVisibleMenu: (targetMenu: VisibleMenu) => void,
    getProgressBars?: (parentElem: React.RefObject<HTMLElement>) => JSX.Element,
    placeholderText: string,
    currentDialectID: KnownDialectID,
    i18nHandler: I18NHandler;
    onDialectSwitch: (dialectID: KnownDialectID) => void,
}

interface SearchBarState {
}

export default class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    textInput: React.RefObject<HTMLInputElement> = React.createRef();

    constructor(props: any) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        this.textInput.current?.focus();
    }

    updateAndFocus(query: string) {
        if (this.textInput.current !== null) {
            this.textInput.current.value = query;
            this.textInput.current.focus();
            // XXX TODO: hack to allow auto focus to work when using react-burger-menu
            setTimeout(() => this?.textInput.current?.focus(), 100);
        }
    }

    onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        this.props.searchQuery(query, {isFromUserTyping: true});
    }

    onSubmit(e: React.FormEvent) {
        e.preventDefault();

        // If the user clicks submit on mobile, dismiss the keyboard:
        if (isMobileDevice()) {
            this.textInput.current?.blur();
        }
    }

    render() {
        const emptyMagGlass = <div className="empty-mag-glass-div" >
            <EmptyMagGlass className="empty-mag-glass" />
        </div>

        const clearXHidden = !this.textInput.current?.value;
        const clearX = <div className="clickable-x-div"
            style={{
                opacity: clearXHidden ? 0 : 1,
                visibility: clearXHidden ? "hidden" : "visible"
            }}
            onClick={this.props.clearQuery}>
            <button className="clickable-x-button">
                Clear Input
            </button>
            <SearchClickableClearSearch className="clickable-x" />
        </div>

        const settingsSliders = <div className="clickable-settings-sliders-div"
            onClick={() => this.props.toggleVisibleMenu(VisibleMenu.SearchOptions)} >
            <button className="clickable-settings-sliders-button">
                Search Options
            </button>
            <SettingsSliders className="clickable-settings-sliders" />
        </div>

        return <>
            <div className="search-bar-container">
                <div className="search-bar">
                    {this.props.getProgressBars?.(this.textInput)}
                    {emptyMagGlass}
                    <form onSubmit={this.onSubmit} autoComplete="off" >
                        <input
                            autoFocus
                            placeholder={this.props.placeholderText}
                            type="text"
                            autoComplete="off"
                            onChange={this.onChange}
                            ref={this.textInput}
                        />
                    </form>
                    {clearX}
                    {settingsSliders}
                </div>
                <BurgerMenu
                    appConfig={this.props.appConfig}
                    loadPage={this.props.loadPage}
                    goHome={this.props.goHome}
                    toggleVisibleMenu={this.props.toggleVisibleMenu}
                    i18nHandler={this.props.i18nHandler}
                    currentDialectID={this.props.currentDialectID}
                    onDialectSwitch={this.props.onDialectSwitch}
                />
            </div>
            <div className="search-area-buffer" />
        </>
    }
}
