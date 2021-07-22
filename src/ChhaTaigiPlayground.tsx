import * as React from "react";

import ChhaTaigiOptions from "./ChhaTaigiOptions";
import ConfigHandler from "./configHandler/ConfigHandler";

// TODO: add yaml to service worker! (? - worth it for speed? does complicate config changes)
// TODO: determine format/location (probably local userstorage) for user config
// TODO: integration test for yaml validity
//          * look up syntax for yaml schema
//          * define required fields for apps, langs, dbs, and fields
//          * import/parse all configs, and check that all required fields are present
//          * use these definitions for fieldclassificationhandler or some better version of it
//          * see if you can use `preload` on these yaml files

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
        const configHandler = new ConfigHandler(this.props.options.appName);
        configHandler.loadLanguageConfigs().then((conf) => console.log(conf));
    }

    render() {
        const output = this.state.output;
        return <div>{output}</div>;
    }
}

