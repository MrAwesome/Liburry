import * as React from "react";
import {ChhaTaigi} from "./ChhaTaigi";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import ConfigHandler from "./configHandler/ConfigHandler";
import {ProgressHandler} from "./progressBars/ProgressBars";
import {AppConfig} from "./types/config";

import "./progressBars/style.css";
import {CHHA_APPNAME} from "./constants";

// XXX TODO: changes to these options won't be persistent here, as changes are handled downstream. Should they be handled here before being passed into the main component?
interface ChhaTaigiLoaderProps {
    options: OptionsChangeableByUser,
}

interface ChhaTaigiLoaderState {
    appConfig?: AppConfig,
}

export class ChhaTaigiLoader extends React.Component<ChhaTaigiLoaderProps, ChhaTaigiLoaderState> {
    private mountAttempt = 0;
    private progress: ProgressHandler;

    constructor(props: ChhaTaigiLoaderProps) {
        super(props);
        this.state = {};

        this.progress = new ProgressHandler(() => this.setState({}));
    }

    componentDidMount() {
        // TODO(wishlist): progressbar for each DB, in a flexbox constellation

        const configHandler = new ConfigHandler(CHHA_APPNAME);

        const configPromises = [
            //configHandler.loadAppConfig(),
            configHandler.loadDBConfigs(),
            //configHandler.loadLanguageConfigs(),
        ];
        this.progress.numConfigsToLoad = configPromises.length;

        // Update the config progressbar whenever a config successfully loads
        const originalMountAttempt = this.mountAttempt;
        configPromises.forEach(prom => {
            prom.then(() => {
                if (originalMountAttempt === this.mountAttempt) {
                    this.progress.numConfigsLoaded += 1;
                    this.progress.updateDisplayForConfigEvent();
                }
            });
        });

        Promise.all(configPromises).then(([dbConfigs]) => {
            const appConfig = AppConfig.from(dbConfigs);
            this.setState({appConfig})
        });
    }

    componentWillUnmount() {
        this.mountAttempt += 1;
        this.progress.numConfigsLoaded = 0;
    }

    render() {
        const {options} = this.props;
        const {appConfig} = this.state;

        return <>
            {this.progress.getBars()}

            {appConfig !== undefined
                ? <ChhaTaigi
                    options={options}
                    appConfig={appConfig}
                    updateDisplayForDBLoadEvent={this.progress.updateDisplayForDBLoadEvent}
                    updateDisplayForSearchEvent={this.progress.updateDisplayForSearchEvent}
                    key="ChhaTaigi"
                />
                : null // TODO: better loading default / errors
            }
        </>
    }
}
