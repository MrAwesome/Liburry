import * as React from "react";
import I18NHandler from "../../common/i18n/I18NHandler";
import {BurgerMenu} from "../menu/BurgerMenu";
import {PageID} from "../configHandler/zodConfigTypes";
import {VisibleMenu} from "../ChhaTaigi";
import {isMobileDevice} from "../utils";

import type AppConfig from "../configHandler/AppConfig";

import {ReactComponent as DialectSwitchButtonTwoBubbles} from "../../icons/langswitchTwoBubbles.svg";
import {ReactComponent as SearchClickableMagGlass} from "../../icons/searchClickableMagGlass.svg";
import "./SearchBar.css";

interface SearchBarProps {
    appConfig: AppConfig,
    searchQuery(query: string, opts?: {isFromUserTyping: boolean}): Promise<void>,
    getNewestQuery(): string,
    loadPage: (pageID: PageID) => void,
    goHome: () => void,
    toggleVisibleMenu: (targetMenu: VisibleMenu) => void,
    getProgressBars?: (parentElem: React.RefObject<HTMLElement>) => JSX.Element,
    i18nHandler?: I18NHandler,
}

interface SearchBarState {
}

export class SearchBar extends React.PureComponent<SearchBarProps, SearchBarState> {
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

    //<svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>

    // XXX TODO: use this instead
    //placeholder={this.props.i18nHandler.getTokenForAllEnabledLangs("search", {delimiter: " / "})}
    // XXX TODO: i18n button text for accessibility?
    render() {
        return <>
            <div className="search-bar-container">
                <div className="search-bar">
                    {this.props.getProgressBars?.(this.textInput)}

                    <div className="clickable-mag-glass-div"
                            onClick={() => this.props.toggleVisibleMenu(VisibleMenu.SearchOptions)} >
                        <button className="clickable-mag-glass-button">
                            Search Options
                        </button>
                        <SearchClickableMagGlass className="clickable-mag-glass" />
                    </div>
                    <form onSubmit={this.onSubmit} autoComplete="off" >
                        <input
                            autoFocus
                            placeholder={this.props.i18nHandler?.tok("search") ?? "Search..."}
                            type="text"
                            autoComplete="off"
                            onChange={this.onChange}
                            ref={this.textInput}
                        />
                    </form>
                </div>
                {
                <div className="dialect-switcher-div"
                        onClick={() => this.props.toggleVisibleMenu(VisibleMenu.DialectSwitcher)} >
                    <button className="dialect-switcher-button">
                        Change Language
                    </button>
                    <DialectSwitchButtonTwoBubbles className="dialect-switcher" />
                </div>
                }
                <BurgerMenu
                    appConfig={this.props.appConfig}
                    loadPage={this.props.loadPage}
                    goHome={this.props.goHome}
                />
            </div>
            <div className="search-area-buffer" />
        </>
    }
}
