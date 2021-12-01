import * as React from "react";
import {MuhError} from "./MuhError";
import {ChhaTaigiLoader} from "../ChhaTaigiLoader";
import MuhErrorDisplay from "./MuhErrorDisplay";

interface EBProps {}
interface EBState {
    muhError?: MuhError | Error,
}
export default class MuhErrorBoundary extends React.Component<EBProps, EBState> {
    constructor(props: EBProps) {
        super(props);
        this.state = {}
        this.fatalError = this.fatalError.bind(this);
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

    render() {
        const {muhError} = this.state;
        if (muhError !== undefined) {
            return <MuhErrorDisplay muhError={muhError} />;
        } else {
            return <ChhaTaigiLoader fatalError={this.fatalError} />;
        }
    }
}
