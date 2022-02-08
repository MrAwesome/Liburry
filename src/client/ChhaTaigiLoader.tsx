import * as React from "react";
import {ChhaTaigi} from "./ChhaTaigi";
import ConfigLoader from "./configHandler/ConfigHandler";
import {ProgressHandler} from "./progressBars/ProgressBars";

import type {ReturnedFinalConfig} from "./configHandler/zodConfigTypes";
import type {MuhError} from "./errorHandling/MuhError";
import type {DebugData} from "./errorHandling/DebugData";

interface ChhaTaigiLoaderProps {
    fatalError: (err: MuhError) => void,
    updateDebugData: (debugDelta: Partial<DebugData>) => void,
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

        this.progress = new ProgressHandler(async () => this.setState({}));
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
                    this.progress.genUpdateDisplayForConfigEvent();
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
                this.setState({rfc});
                this.props.updateDebugData({rfc});
            }
        });
    }

    componentWillUnmount() {
        this.mountAttempt += 1;
        this.progress.numConfigsLoaded = 0;
    }

    render() {
        const {rfc} = this.state;
        const {genUpdateDisplayForDBLoadEvent, genUpdateDisplayForSearchEvent} = this.progress;

        let mainApp = rfc !== undefined
            ? <ChhaTaigi
                rfc={rfc}
                genUpdateDisplayForDBLoadEvent={genUpdateDisplayForDBLoadEvent}
                genUpdateDisplayForSearchEvent={genUpdateDisplayForSearchEvent}
                key="ChhaTaigi"
                getProgressBars={this.progress.getBars}
            />
            : null;

        // TODO: make config progress bar move during initial load, show *something*
        return <>
            {mainApp ?? this.progress.getBars(undefined)}
        </>
    }
}
