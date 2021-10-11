import { render, screen } from '@testing-library/react';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChhaTaigi} from './ChhaTaigi';
import OptionsChangeableByUser from './ChhaTaigiOptions';
import * as React from 'react';
import {noop} from './utils';
import {DBSearchRanking, SearcherType} from './search';
import ConfigHandler from './configHandler/ConfigHandler';
import {AppConfig} from './types/config';
import {AnnotatedPerDictResults, annotateRawResults, PerDictResultsRaw} from './types/dbTypes';

// NOTE: just used to silence errors in node TSC.
noop(React.version);

// NOTE: this is a pretty full integration test, which relies on the content of the field classification database
//       the contents of it can be mocked out and tested, at some inconvenience

// TODO(high): test basic worker search behavior (probably not possible from jest?)
// TODO(low): figure out how to run componentDidMount

export async function getAppConfig() {
    const configHandler = new ConfigHandler("taigi.us", true);
    return Promise.all([
        //configHandler.loadAppConfig(),
        configHandler.loadDBConfigs(),
        //configHandler.loadLanguageConfigs(),
    ]).then(([
        //rawAppConfig,
        dbConfigs,
        //langConfigs
    ]) => {
        return AppConfig.from(dbConfigs);
    });
}

const appConfigPromise = getAppConfig();

test('render searchbar by default', async () => {
    const appConfig = await appConfigPromise;
    let options = new OptionsChangeableByUser();
    render(<ChhaTaigi appConfig={appConfig} options={options} />);
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toBeEmptyDOMElement();
    expect(searchBar).toHaveFocus();
});

test('render single entry via override', async () => {
    // TODO: simplify this
    let options = new OptionsChangeableByUser();
    options.mainMode = MainDisplayAreaMode.SEARCH;

    const dbIdentifier = "ChhoeTaigi_TaioanPehoeKichhooGiku";
    const rowID = 1;

    const marked = `hoat-<mark>lu̍t</mark>`;

    const dbSearchRanking = {searcherType: SearcherType.LUNR, score: -3} as DBSearchRanking;
    let res1 = {
        key: `${dbIdentifier}-${rowID}`,
        rowID,
        dbIdentifier,
        dbSearchRanking,
        fields: [
            {
                colName: "PojUnicode",
                value: "hoat-lu̍t",
                matched: true,
                displayValOverride: marked,
            },
            {
                colName: "PojInput",
                value: "hoat-lut8",
                matched: false,
            },
            {
                colName: "HoaBun",
                value: "法律",
                matched: false,
            },
            {
                colName: "PojNormalized",
                value: "hoat-lut",
                matched: false,
            },
            {
                colName: "EngBun",
                value: "the law",
                matched: false,
            },
        ],
    };

    let perDictRes: PerDictResultsRaw = {
        dbIdentifier,
        results: [res1],
    };

    const appConfig = await appConfigPromise;

    const annotatedResRaw = annotateRawResults(perDictRes, appConfig);
    const annotatedRes = new AnnotatedPerDictResults(annotatedResRaw);

    render(<ChhaTaigi options={options} appConfig={appConfig} mockResults={annotatedRes} />);

    const hoabun = screen.getByText(/法律/i);
    expect(hoabun).toBeInTheDocument();
    // TODO: find mark, etc
    const poj = screen.getByText(/lu̍t/i);
    expect(poj).toBeInTheDocument();

    //const pojNoMatch = screen.getByText(/hoat-lu̍t/i);
    //expect(pojNoMatch).not.toBeInTheDocument();

    const eng = screen.getByText(/the law/i);
    expect(eng).toBeInTheDocument();

    // TODO: display DB again at some point, possibly in debug mode
    //const db = screen.getByText(/TaioanPehoeKichhooGiku/i);
    //expect(db).toBeInTheDocument();
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
});
