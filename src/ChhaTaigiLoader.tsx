import * as React from "react";
import {ChhaTaigi, LoadedDBsMap} from "./ChhaTaigi";
import OptionsChangeableByUser from "./ChhaTaigiOptions";
import ConfigHandler from "./configHandler/ConfigHandler";
import {makeProgressBar, PROGRESS_BARS_HEIGHT, PROGRESS_BAR_ANIMATION_LENGTH} from "./progressBars/ProgressBars";
import {SearchContext} from "./SearchValidityManager";
import {AppConfig} from "./types/config";

import "./progressBars/style.css";

// XXX TODO: changes to these options won't be persistent here, as changes are handled downstream. Should they be handled here before being passed into the main component?
interface ChhaTaigiLoaderProps {
    options: OptionsChangeableByUser,
}

interface ChhaTaigiLoaderState {
    appConfig?: AppConfig,
    configProgress: number,
    configShouldShow: boolean,
    dbLoadProgress: number,
    dbLoadShouldShow: boolean,
    searchProgress: number,
    searchShouldShow: boolean,
}

export class ChhaTaigiLoader extends React.Component<ChhaTaigiLoaderProps, ChhaTaigiLoaderState> {
    private mountAttempt = 0;
    private appName: string = "taigi.us"; // XXX TODO: don't hardcode

    private numConfigsToLoad = 0;
    private numConfigsLoaded = 0;

    constructor(props: ChhaTaigiLoaderProps) {
        super(props);
        this.state = {
            configProgress: 0,
            configShouldShow: true,
            dbLoadProgress: 0,
            dbLoadShouldShow: true,
            searchProgress: 0,
            searchShouldShow: false,
        }

        this.updateDisplayForConfigEvent = this.updateDisplayForConfigEvent.bind(this);
        this.updateDisplayForDBLoadEvent = this.updateDisplayForDBLoadEvent.bind(this);
        this.updateDisplayForSearchEvent = this.updateDisplayForSearchEvent.bind(this);
    }

    componentDidMount() {
        // TODO(wishlist): progressbar for each DB, in a flexbox constellation

        const configHandler = new ConfigHandler(this.appName);

        const configPromises = [
            //configHandler.loadAppConfig(),
            configHandler.loadDBConfigs(),
            //configHandler.loadLanguageConfigs(),
        ];
        this.numConfigsToLoad = configPromises.length;

        const originalMountAttempt = this.mountAttempt;
        configPromises.forEach(prom => {
            prom.then(() => {
                if (originalMountAttempt === this.mountAttempt) {
                    this.numConfigsLoaded += 1;
                    this.updateDisplayForConfigEvent();
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
        this.numConfigsLoaded = 0;
    }

    updateDisplayForConfigEvent() {
        const percent = this.numConfigsLoaded / this.numConfigsToLoad;
        this.setState({configProgress: percent});

        if (this.numConfigsToLoad === 0 || percent >= 1) {
            setTimeout(() => {
                this.setState({configShouldShow: false});
            }, PROGRESS_BAR_ANIMATION_LENGTH);
        }
    }

    // TODO: the progressbar logic should live in a separate class, and dbLoadBar should be only about loading.
    updateDisplayForDBLoadEvent(loadedDBs: LoadedDBsMap) {
        let numLoaded = 0;
        let numTotal = 0;

        // If you really want to nitpick CPU cycles, this can be stored on LoadedDBsMap
        loadedDBs.forEach((isLoaded, _name) => {
            numTotal += 1;
            if (isLoaded) {
                numLoaded += 1;
            }
        });

        const percent = (numLoaded / numTotal);
        this.setState({dbLoadProgress: percent});

        if (numTotal === 0 || percent >= 1) {
            setTimeout(() => {
                this.setState({dbLoadShouldShow: false});
            }, PROGRESS_BAR_ANIMATION_LENGTH);
        }
    }

    updateDisplayForSearchEvent(searchContext: SearchContext | null) {
        if (searchContext === null) {
            this.setState({searchShouldShow: false});
            return;
        }

        this.setState({searchShouldShow: true});

        const [completedDBs, totalDBs] = searchContext.getCompletedAndTotal();
        const percent = completedDBs / totalDBs;

        this.setState({searchProgress: percent});

        if (totalDBs === 0 || percent >= 1) {
            setTimeout(() => {
                this.setState({searchShouldShow: false});
            }, PROGRESS_BAR_ANIMATION_LENGTH);
        }
    }

    render() {
        const {appConfig,
            configProgress,
            configShouldShow,
            dbLoadProgress,
            dbLoadShouldShow,
            searchProgress,
            searchShouldShow,
        } = this.state;
        const {options} = this.props;

        const progressBars = [
            makeProgressBar(configProgress, "chhaConfigBar"),
            makeProgressBar(dbLoadProgress, "chhaDBLoadBar"),
            makeProgressBar(searchProgress, "chhaSearchBar"),
        ];

        const height =
            (configShouldShow || dbLoadShouldShow || searchShouldShow)
                ? PROGRESS_BARS_HEIGHT : "0px";

        return <>
            <div className="loadingBarContainer" style={{height}}>
                {progressBars}
            </div>

            {appConfig !== undefined
                ? <ChhaTaigi
                    options={options}
                    appConfig={appConfig}
                    updateDisplayForDBLoadEvent={this.updateDisplayForDBLoadEvent}
                    updateDisplayForSearchEvent={this.updateDisplayForSearchEvent}
                    key="ChhaTaigi"
                />
                : null
            }
        </>
    }
}
