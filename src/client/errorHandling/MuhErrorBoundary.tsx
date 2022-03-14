import * as React from "react";
import MuhErrorDisplay from "./MuhErrorDisplay";

import type {MuhError} from "./MuhError";
import type {DebugData} from "./DebugData";

interface EBProps {
}
interface EBState {
    muhError?: MuhError | Error,
    debugData?: DebugData,
}

export default class MuhErrorBoundary extends React.Component<EBProps, EBState> {
    constructor(props: EBProps) {
        super(props);
        this.state = {}
        this.raiseFatalError = this.raiseFatalError.bind(this);
        this.updateDebugData = this.updateDebugData.bind(this);
    }

    raiseFatalError(muhError: MuhError) {
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

            const {raiseFatalError, updateDebugData} = this;
            return React.Children.map(
                this.props.children,
                (child) => {
                    if (!React.isValidElement(child)) {return child;}
                    return React.cloneElement(child, {raiseFatalError, updateDebugData});
                }
            );
        }
    }
}
