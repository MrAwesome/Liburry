import fs from 'fs';
import { render, screen } from '@testing-library/react';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChhaTaigi} from './ChhaTaigi';
import OptionsChangeableByUser from './ChhaTaigiOptions';
import * as React from 'react';
import {noop} from './utils';
import {DBSearchRanking, SearcherType} from './search';
import FieldClassificationHandler, {DEFAULT_FIELD_CLASSIFICATION_DB_FILENAME} from './search/FieldClassificationHandler';
import {MATCH_HTML_TAG} from './constants';

// NOTE: just used to silence errors in node TSC.
noop(React.version);

// NOTE: this is a pretty full integration test, which relies on the content of the field classification database
//       the contents of it can be mocked out and tested, at some inconvenience

// TODO(high): test basic worker search behavior (probably not possible from jest?)
// TODO(low): figure out how to run componentDidMount

test('render searchbar by default', () => {
    render(<ChhaTaigi />);
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toBeEmptyDOMElement();
    expect(searchBar).toHaveFocus();
});

test('render single entry via override', async () => {
    // TODO: simplify this
    const classificationText = fs.readFileSync("public/" + DEFAULT_FIELD_CLASSIFICATION_DB_FILENAME);
    const fieldHandlerPromise = FieldClassificationHandler.fromText(classificationText.toString());

    let options = new OptionsChangeableByUser();
    options.mainMode = MainDisplayAreaMode.SEARCH;

    const dbName = "maryknoll";
    const dbFullName = "ChhoeTaigi_TaioanPehoeKichhooGiku";
    const rowID = 1;

    const marked = `hoat-<${MATCH_HTML_TAG}>lu̍t</${MATCH_HTML_TAG}>`;

    const dbSearchRanking = {searcherType: SearcherType.LUNR, score: -3} as DBSearchRanking;
    let res1 = {
        key: `${dbName}-${rowID}`,
        rowID,
        dbName,
        dbFullName,
        dbSearchRanking,
        fields: [
            {
                colName: "poj_unicode",
                value: "hoat-lu̍t",
                matched: true,
                displayValOverride: marked,
            },
            {
                colName: "poj_input",
                value: "hoat-lut8",
                matched: false,
            },
            {
                colName: "hoabun",
                value: "法律",
                matched: false,
            },
            {
                colName: "poj_normalized",
                value: "hoat-lut",
                matched: false,
            },
            {
                colName: "english",
                value: "the law",
                matched: false,
            },
        ],
    };

    let perDictRes = {
        dbName: "ChhoeTaigi_TaioanPehoeKichhooGiku",
        results: [res1],
    };

    const fieldHandler = await fieldHandlerPromise;
    render(<ChhaTaigi options={options} mockResults={perDictRes} overrideFieldHandler={fieldHandler} />);

    const hoabun = screen.getByText(/法律/i);
    expect(hoabun).toBeInTheDocument();
    // TODO: find mark, etc
    const poj = screen.getByText(/lu̍t/i);
    expect(poj).toBeInTheDocument();

    //const pojNoMatch = screen.getByText(/hoat-lu̍t/i);
    //expect(pojNoMatch).not.toBeInTheDocument();

    const eng = screen.getByText(/the law/i);
    expect(eng).toBeInTheDocument();
    const db = screen.getByText(/maryknoll/i);
    expect(db).toBeInTheDocument();
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
});
