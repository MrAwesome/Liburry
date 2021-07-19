import * as React from "react";
import yaml from "yaml";

import ChhaTaigiOptions from "./ChhaTaigiOptions";

// TODO: add yaml to service worker! (? - worth it for speed? does complicate config changes)
// TODO: determine format/location (probably local userstorage) for user config
// TODO: integration test for yaml validity
//          * define required fields for apps, langs, dbs, and fields
//          * import/parse all configs, and check that all required fields are present


interface ChhaTaigiPlaygroundProps {
    options: ChhaTaigiOptions,
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
    
    componentDidMount() {
        fetch("TEST_YAML.yaml").then((resp) => resp.text()).then((yamlText) => {
            const muh = yaml.parse(yamlText);
            console.log(muh);
        });
    }

    render() {
        const output = this.state.output;
        return <div>{output}</div>;
        
    }
}

