import * as React from "react";
import {ChhaTaigiLoader} from "../ChhaTaigiLoader";
import MuhErrorDisplay from "./MuhErrorDisplay";

import type {MuhError} from "./MuhError";
import type {DebugData} from "./DebugData";

interface EBProps {}
interface EBState {
    muhError?: MuhError | Error,
    debugData?: DebugData,
}

export default class MuhErrorBoundary extends React.Component<EBProps, EBState> {
    constructor(props: EBProps) {
        super(props);
        this.state = {}
        this.fatalError = this.fatalError.bind(this);
        this.updateDebugData = this.updateDebugData.bind(this);
    }

    fatalError(muhError: MuhError) {
        this.setState({muhError});
    }

    static getDerivedStateFromError(error: any) {
        return {muhError: error};
    }

    componentDidCatch(error: any, errorInfo: any) {
        // You can also log the error to an error reporting service
        console.log({error, errorInfo});
    }

    updateDebugData(debugDelta: Partial<DebugData>) {
        this.setState({debugData: {...this.state.debugData, ...debugDelta}});
    }

    render() {
        const {muhError, debugData} = this.state;
        if (muhError !== undefined) {
            return <MuhErrorDisplay muhError={muhError} debugData={debugData} />;
        } else {
            return <ChhaTaigiLoader
                fatalError={this.fatalError}
                updateDebugData={this.updateDebugData}
            />;
        }
    }
}
