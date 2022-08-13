import * as React from "react";

import OptionsChangeableByUser from "./ChhaTaigiOptions";

interface ChhaTaigiPlaygroundProps {
    options: OptionsChangeableByUser,
}

interface ChhaTaigiPlaygroundState {
    output: string,
}

export class ChhaTaigiPlayground extends React.Component<ChhaTaigiPlaygroundProps, ChhaTaigiPlaygroundState> {
    constructor(props: ChhaTaigiPlaygroundProps) {
        super(props);
        this.state = {
            output: "",
        }
    }

    render() {
        const output = this.state.output;
        return <div>{output}</div>;
    }
}

