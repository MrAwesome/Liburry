import * as React from "react";
import {ChhaTaigi} from "./ChhaTaigi";
import ConfigLoader from "./configHandler/ConfigHandler";
import {ProgressHandler} from "./progressBars/ProgressBars";

import {ReturnedFinalConfig} from "./configHandler/zodConfigTypes";
import {MuhError} from "./errorHandling/MuhError";

interface ChhaTaigiLoaderProps {
    fatalError: (err: MuhError) => void,
}

interface ChhaTaigiLoaderState {
    rfc?: ReturnedFinalConfig,
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
        const configLoader = new ConfigLoader();
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
                const rfc = finalConfigOrErr as ReturnedFinalConfig;
                this.setState({rfc})
            }
        });
    }

    componentWillUnmount() {
        this.mountAttempt += 1;
        this.progress.numConfigsLoaded = 0;
    }

    render() {
        const {rfc} = this.state;

        let mainApp = rfc !== undefined
            ? <ChhaTaigi
                rfc={rfc}
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
