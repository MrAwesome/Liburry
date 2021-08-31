import * as React from "react";
import {ChhaTaigi} from "./ChhaTaigi";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import ConfigHandler from "./configHandler/ConfigHandler";
import {AppConfig} from "./types/config";

// XXX TODO: changes to these options won't be persistent here, as changes are handled downstream. Should they be handled here before being passed into the main component?
interface ChhaTaigiLoaderProps {
    options: OptionsChangeableByUser,
}

interface ChhaTaigiLoaderState {
    appConfig?: AppConfig,
}

export class ChhaTaigiLoader extends React.Component<ChhaTaigiLoaderProps, ChhaTaigiLoaderState> {
    private appName: string = "taigi.us"; // XXX TODO: don't hardcode

    constructor(props: ChhaTaigiLoaderProps) {
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
        const configHandler = new ConfigHandler(this.appName);
        Promise.all([
            //configHandler.loadAppConfig(),
            configHandler.loadDBConfigs(),
            //configHandler.loadLanguageConfigs(),
        ]).then(([
            //rawAppConfig,
            dbConfigs,
            //langConfigs
        ]) => {
            const appConfig = AppConfig.from(dbConfigs);
            this.setState({appConfig})
        });
    }

    render() {
        const {appConfig} = this.state;
        const {options} = this.props;
        if (appConfig) {
            return <ChhaTaigi options={options} appConfig={appConfig} />;
        } else {
            // XXX TODO: make an actual loading screen!
            return "Loading...";
        }
    }
}
