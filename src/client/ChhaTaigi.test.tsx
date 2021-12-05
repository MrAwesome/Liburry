import { render, screen } from '@testing-library/react';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChhaTaigi} from './ChhaTaigi';
import OptionsChangeableByUser from './ChhaTaigiOptions';
import * as React from 'react';
import '@testing-library/jest-dom/extend-expect';
import {noop} from './utils';
import {DBSearchRanking, SearcherType} from './search';
import ConfigHandler from './configHandler/ConfigHandler';
import {AnnotatedPerDictResults, annotateRawResults, PerDictResultsRaw} from './types/dbTypes';
import AppConfig from './configHandler/AppConfig';
import {ReturnedFinalConfig} from './configHandler/zodConfigTypes';
import {MuhError} from './errorHandling/MuhError';

// NOTE: just used to silence errors in node TSC.
noop(React.version);

// NOTE: this is a pretty full integration test, which relies on the content of the field classification database
//       the contents of it can be mocked out and tested, at some inconvenience

// TODO(high): test basic worker search behavior (probably not possible from jest?)
// TODO(low): figure out how to run componentDidMount
// TODO(later): migrate to createRoot - right now, using it crashes the test runner.

export async function genRFC(): Promise<ReturnedFinalConfig> {
    const configHandler = new ConfigHandler(["taigi.us"], {localMode: true});
    const maybeError = await configHandler.genLoadFinalConfig();
    if ((maybeError as MuhError).muhErrType !== undefined) {
        throw maybeError;
    } else {
        return maybeError as ReturnedFinalConfig;
    }

}

test('render searchbar by default', async () => {
    const rfc = await genRFC();
    let options = new OptionsChangeableByUser();
    const app = <ChhaTaigi rfc={rfc} mockOptions={options} />;
    render(app, { legacyRoot: true });

    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toBeEmptyDOMElement();
    // XXX TODO: react-burger-menu broke this, and a timeout hack is being used which doesn't work with this test
    //expect(searchBar).toHaveFocus();
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

    const rfc = await genRFC();

    const appConfig = AppConfig.from(rfc, "taigi.us");
    const annotatedResRaw = annotateRawResults(perDictRes, appConfig);
    const annotatedRes = new AnnotatedPerDictResults(annotatedResRaw);

    const app = <ChhaTaigi mockOptions={options} rfc={rfc} mockResults={annotatedRes} />;
    render(app, { legacyRoot: true });

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
