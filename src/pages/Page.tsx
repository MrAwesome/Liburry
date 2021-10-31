import * as React from "react";
import ReactMarkdown from 'react-markdown';
import {AppID, LoadedPage} from "../configHandler/zodConfigTypes";
import * as constants from "../constants";

import "./pages.css";

interface CPageProps {
    perAppPages: Map<AppID, LoadedPage>;
}

// TODO: add support for using variables from constants.ts in markdown files
// TODO: use menu.yml to determine which configs to read in / add to the config
// TODO: use menu.yml to generate the links that will point to these
export class CombinedPageElement extends React.PureComponent<CPageProps, any> {
    render() {
        const pages: JSX.Element[] = [];
        this.props.perAppPages.forEach((page, appID) => {
            pages.push(<div className="individual-page" key={`page-${appID}`}> {getHtmlForLoadedPage(page)} </div>);
        });

        return <div className="combined-page"> {pages} </div>;

    }
}

function getHtmlForLoadedPage(p: LoadedPage) {
    if (p.pageType === "markdown") {
        const {mdText} = p;
        const mdTextWithConstants = replaceConstants(mdText);
        return <ReactMarkdown linkTarget="_blank">{mdTextWithConstants}</ReactMarkdown>;
    }
}

function replaceConstants(s: string) {
    return s.replace(/\${([a-zA-Z_][a-zA-Z0-9_]*)}/, (_match, p1) => {
        const varName = p1 as keyof typeof constants;
        if (
            varName in constants &&
            typeof constants[varName] === "string"
        ) {
            return constants[varName] as string;
        } else {
            return "";
        }
    });
}
