import * as React from "react";
import {ChhaTaigi} from "./ChhaTaigi";
import ConfigLoader from "./configHandler/ConfigHandler";
import {ProgressHandler} from "./progressBars/ProgressBars";

import {CHHA_APPNAME} from "./constants";
import AppConfig from "./configHandler/AppConfig";
import {ReturnedFinalConfig} from "./configHandler/zodConfigTypes";
import {MuhError} from "./errorHandling/MuhError";

interface ChhaTaigiLoaderProps {
    fatalError: (err: MuhError) => void,
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
        const configLoader = new ConfigLoader(["test/simpletest"]);
        const configPromises = [configLoader.genLoadFinalConfig()];
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

        Promise.all(configPromises).then(([finalConfigOrErr]) => {
            if ((finalConfigOrErr as MuhError).muhErrType !== undefined) {
                const configHandlerError = finalConfigOrErr as MuhError;
                console.error("ConfigHandler Error: ", configHandlerError);
                this.props.fatalError(configHandlerError);
            } else {
                const finalConfig = finalConfigOrErr as ReturnedFinalConfig;


                // TODO: XXX: yuh
                const subAppID = "eng_poj";

                const appConfig = AppConfig.from(finalConfig, CHHA_APPNAME, subAppID);
                this.setState({appConfig})
            }
        });
    }

    componentWillUnmount() {
        this.mountAttempt += 1;
        this.progress.numConfigsLoaded = 0;
    }

    render() {
        const {appConfig} = this.state;

        let mainApp = appConfig !== undefined
            ? <ChhaTaigi
                appConfig={appConfig}
                updateDisplayForDBLoadEvent={this.progress.updateDisplayForDBLoadEvent}
                updateDisplayForSearchEvent={this.progress.updateDisplayForSearchEvent}
                key="ChhaTaigi"
            />
            : null;

        // TODO: make config progress bar move during initial load, show *something*
        return <>
            {this.progress.getBars()}
            {mainApp}
        </>
    }
}
