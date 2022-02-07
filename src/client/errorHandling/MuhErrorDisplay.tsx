import * as React from "react";
import StackTrace from "stacktrace-js";
import Collapsible from 'react-collapsible';
import {REPO_LINK} from "../constants";

import type {MuhError} from "../errorHandling/MuhError";
import type {DebugData} from "./DebugData";

import "./MuhErrorDisplay.css";

// TODO: put content into YAML, translate errors into other languages?

interface MEProps {
    muhError: MuhError | Error,
    debugData: DebugData | undefined,
}

interface MEState {
    stackTrace: string,
    stackTraceSourceMapString?: string,
}

export default class MuhErrorDisplay extends React.PureComponent<MEProps, MEState>{
    constructor(props: MEProps) {
        super(props);
        this.state = {
            stackTrace: this.props.muhError.stack ?? "<undefined>",
        }
        this.getIssueCreationURL = this.getIssueCreationURL.bind(this);
        this.getStackTrace = this.getStackTrace.bind(this);
    }

    componentDidMount() {
        genStackTrace(this.props.muhError)
            .then((st) => {this.setState({stackTraceSourceMapString: st})});
    }

    render() {
        const {muhError} = this.props;
        const err = muhError;
        return <div className="muh-error-container">
            <div className="muh-error">
                <div className="muh-error-header">Encountered an error!</div>
                <div className="muh-error-body">
                    <div className="muh-error-type">
                        <div className="muh-error-type-prefix">Error Type: </div>
                        <div className="muh-error-type-content">{getType(err)}</div>
                    </div>
                    <div className="muh-error-message">

                        <div className="muh-error-message-prefix">Error Message: </div>
                        <div className="muh-error-message-content">{err.message}</div>
                    </div>
                </div>
                <div className="muh-howto">
                    <br />
                    &nbsp; ⟳ Reload: <button onClick={() => window.location.reload()}>Reload</button>
                    <br />
                    <br />
                    &nbsp; ← Reset temporary options: <button onClick={() => {window.location.hash = ""; window.location.reload();}}>Reset</button>
                    <br />
                    <br />
                    &nbsp; ✖️ Close all open tabs/windows of this page, and load it again.
                    <br />
                    <i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(This is important! The way this app loads code requires that all windows and tabs are closed before new code is loaded.)</i>
                    <br />
                    <br />
                    &nbsp; 👀 Check if anyone else has reported the issue yet <a href={`${REPO_LINK}/issues`} target="_blank" rel="noreferrer">here</a>.
                    <br />
                    <br />
                    &nbsp; ‼️ Create an issue by clicking <a href={this.getIssueCreationURL(err)} target="_blank" rel="noreferrer">here</a>.
                    <br />
                    <br />
                    {this.getDebugArea()}
                </div>
            </div>
        </div>
    }

    getDebugArea() {
        const {debugData} = this.props;
        const {rfc} = debugData ?? {};
        return <>
            <ErrCollapsible triggerName="Stack Trace">
                <pre><code>
                    {this.getStackTrace()}
                </code></pre>
            </ErrCollapsible>
            <ErrCollapsible triggerName="App Configuration">
                <pre><code>
                    {rfc !== undefined ? JSON.stringify(debugData, undefined, 2) : "undefined"}
                </code></pre>
            </ErrCollapsible>
        </>
    }

    getIssueCreationURL(err: MuhError | Error): string {
        const userAgent = navigator.userAgent;
        const title = encodeURIComponent(`[USER] Error Report: ${getType(err)}`);
        const body = encodeURIComponent(
            `Error Type: \`${getType(err)}\`
Error Message: \`${err.message}\`
UserAgent: \`${userAgent}\`
Stack Trace:
\`\`\`${this.getStackTrace()}\`\`\`

(Please give any additional information under this line:)

--------------------------------------------

`);
        const getParams = `title=${title}&body=${body}`;
        return `${REPO_LINK}/issues/new?${getParams}`;
    }

    getStackTrace(): string {
        return this.state.stackTraceSourceMapString ?? this.state.stackTrace;
    }
}

function getType(err: MuhError | Error): string {
    return (err as MuhError).muhErrType ?? err.name ?? "<unknown>";
}

function ErrCollapsible(props: React.PropsWithChildren<{triggerName: string}>) {
    return <Collapsible
        trigger={props.triggerName}
        className="ErrCollapsible"
        openedClassName="ErrCollapsible"
        triggerClassName="ErrCollapsible__trigger"
        triggerOpenedClassName="ErrCollapsible__triggerOpen"
        contentOuterClassName="ErrCollapsible__contentOuter"
        contentInnerClassName="ErrCollapsible__contentInner"
        // NOTE: transitionTime being 0 seems to break closing entirely.
        transitionTime={1}
        transitionCloseTime={1}
        >
        {props.children}
    </Collapsible>

}

async function genStackTrace(err: MuhError | Error): Promise<string> {
    const traceArr = await StackTrace.fromError(err);
    console.log("Generated stack trace with source map: ", traceArr);
    const traceStr = traceArr.map((st) => st.toString()).join("\n    ");
    return traceStr;
}
