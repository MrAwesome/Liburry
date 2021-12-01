import * as React from "react";
import StackTrace from "stacktrace-js";
import {REPO_LINK} from "../constants";
import {MuhError} from "../errorHandling/MuhError";
import "./MuhErrorDisplay.css";

// TODO: Translate errors into other languages?

interface MEProps {
    muhError: MuhError | Error,
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
    }

    componentDidMount() {
        genStackTrace(this.props.muhError)
            .then((st) => {this.setState({stackTraceSourceMapString: st})});
    }

    render() {
        const err = this.props.muhError;
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
                    &nbsp; ⟳ Reload the page: <button onClick={() => window.location.reload()}>Reload</button>
                    <br />
                    <br />
                    &nbsp; ✖️ Close all open tabs/windows of this page, and load it again.
                    <br />
                    <br />
                    &nbsp; 👀 Check if anyone else has reported the issue yet <a href={`${REPO_LINK}/issues`} target="_blank" rel="noreferrer">here</a>.
                    <br />
                    <br />
                    &nbsp; ‼️ Create an issue by clicking <a href={this.getIssueCreationURL(err)} target="_blank" rel="noreferrer">here</a>.
                    <br />
                    <br />
                </div>
            </div>
        </div>
    }


    getIssueCreationURL(err: MuhError | Error): string {
        const userAgent = navigator.userAgent;
        const title = encodeURIComponent(`[USER] Error Report: ${getType(err)}`);
        const body = encodeURIComponent(
`Error Type: \`${getType(err)}\`
Error Message: \`${err.message}\`
UserAgent: \`${userAgent}\`
Stack Trace:
\`\`\`${this.state.stackTraceSourceMapString ?? this.state.stackTrace}\`\`\`

(Please give any additional information under this line:)

--------------------------------------------

`);
        const getParams = `title=${title}&body=${body}`;
        return `${REPO_LINK}/issues/new?${getParams}`;
    }
}

function getType(err: MuhError | Error): string {
    return (err as MuhError).muhErrType ?? err.name ?? "<unknown>";
}

async function genStackTrace(err: MuhError | Error): Promise<string> {
    const traceArr = await StackTrace.fromError(err);
    console.log("Generated stack trace with source map: ", traceArr);
    const traceStr = traceArr.map((st) => st.toString()).join("\n    ");
    return traceStr;
}
