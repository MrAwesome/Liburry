import fs from 'fs';
import { render, screen } from '@testing-library/react';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChhaTaigi} from './ChhaTaigi';
import {PerDictResultsRaw, SearchResultEntryRaw} from './types/dbTypes';
import ChhaTaigiOptions from './ChhaTaigiOptions';
import * as React from 'react';
import {noop} from './utils';
import {DBSearchRanking, SearcherType} from './search';
import FieldClassificationHandler, {DEFAULT_FIELD_CLASSIFICATION_DB} from './search/FieldClassificationHandler';
import {MATCH_HTML_TAG} from './constants';

// NOTE: just used to silence errors in node TSC.
noop(React.version);

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
    const classificationText = fs.readFileSync("public/" + DEFAULT_FIELD_CLASSIFICATION_DB);
    const fieldHandlerPromise = FieldClassificationHandler.fromText(classificationText.toString());

    let options = new ChhaTaigiOptions();
    options.mainMode = MainDisplayAreaMode.SEARCH;

    const dbName = "malee";
    const dbID = 1;

    const marked = `hoat-<${MATCH_HTML_TAG}>lu̍t</${MATCH_HTML_TAG}>`;

    const dbSearchRanking = {searcherType: SearcherType.LUNR, score: -3} as DBSearchRanking;
    let res1 = {
        key: `${dbName}-${dbID}`,
        dbID,
        dbName,
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
    } as SearchResultEntryRaw;

    let perDictRes = {
        dbName: "malee",
        results: [res1],
    } as PerDictResultsRaw;

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
    const db = screen.getByText(/malee/i);
    expect(db).toBeInTheDocument();
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
});
