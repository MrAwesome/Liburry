import * as React from "react";
import {REPO_LINK} from "../constants";
import {CHError} from "./ConfigHandler";
import "./ConfigHandlerErrorDisplay.css";

// TODO: Translate errors into other languages?

interface CHEDProps {
    configHandlerError: CHError,
}

export default class ConfigHandlerErrorDisplay extends React.PureComponent<CHEDProps, {}>{
    render() {
        const err = this.props.configHandlerError;
        return <div className="config-handler-error-container">
            <div className="config-handler-error">
                <div className="config-handler-error-header">Encountered an error when loading!</div>
                <div className="config-handler-error-body">
                    <div className="config-handler-error-type">
                        <div className="config-handler-error-type-prefix">Error Type: </div>
                        <div className="config-handler-error-type-content">{err.chErrType}</div>
                    </div>
                    <div className="config-handler-error-message">

                        <div className="config-handler-error-message-prefix">Error Message: </div>
                        <div className="config-handler-error-message-content">{err.message}</div>
                    </div>
                </div>
                <div className="config-handler-howto">
                    &nbsp; ⟳ Reload the page: <button onClick={() => window.location.reload()}>Reload</button>
                    <br />
                    <br />
                    &nbsp; ✖️ Close all open tabs/windows of this page, and load it again.
                    <br />
                    <br />
                    &nbsp; 👀 Check if anyone else has reported the issue yet <a href={`${REPO_LINK}/issues`} target="_blank" rel="noreferrer">here</a>.
                    <br />
                    <br />
                    &nbsp; ‼️ Create an issue by clicking <a href={getIssueCreationURL(err)}>here</a>.
                    <br />
                    <br />
                </div>
            </div>
        </div>
    }
}

function getIssueCreationURL(err: CHError): string {
    const {chErrType, chErrMessage} = err;
    const userAgent = navigator.userAgent;
    const title = encodeURIComponent(`[USER] Config load error: ${chErrType}`);
    const body = encodeURIComponent(
`Error Type: ${chErrType}
Error Message: ${chErrMessage}
UserAgent: ${userAgent}

(Please give any additional information under this line:)
--------------------------------------------
`);
    const getParams = `title=${title}&body=${body}`;
    return `${REPO_LINK}/issues/new?${getParams}`;
}
