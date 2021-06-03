import { render, screen } from '@testing-library/react';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChaTaigi} from './ChaTaigi';
import {PerDictResults, SearchResultEntry} from './types/dbTypes';
import ChaTaigiOptions from './ChaTaigiOptions';

// TODO(high): test basic worker search behavior (probably not possible from jest?)
// TODO(low): figure out how to run componentDidMount

test('render searchbar by default', () => {
    render(<ChaTaigi />);
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toBeEmptyDOMElement();
    expect(searchBar).toHaveFocus();
});

test('render single entry via override', () => {
    let options = new ChaTaigiOptions();
    options.mainMode = MainDisplayAreaMode.SEARCH;

    const dbName = "malee";
    const dbID = 1;
    let res1 = {
        key: `${dbName}-${dbID}`,
        dbID,
        dbName,
        dbSearchRanking: -3,
        pojUnicodeText: "hoat-lu̍t",
        pojUnicodePossibleMatch: "hoat-lu̍t",
        pojInputPossibleMatch: "hoat-lut8",
        hoabunPossibleMatch: "法律",
        pojNormalizedPossibleMatch: "hoat-lut",
        definitionPossibleMatch: "the law",
    } as SearchResultEntry;

    let perDictRes = {
        dbName: "malee",
        results: [res1],
    } as PerDictResults;

    render(<ChaTaigi options={options} mockResults={perDictRes} />);

    const hoabun = screen.getByText(/法律/i);
    expect(hoabun).toBeInTheDocument();
    const poj = screen.getByText(/hoat-lu̍t/i);
    expect(poj).toBeInTheDocument();
    const eng = screen.getByText(/the law/i);
    expect(eng).toBeInTheDocument();
    const db = screen.getByText(/malee/i);
    expect(db).toBeInTheDocument();
    const searchBar = screen.getByPlaceholderText(/Search.../);
    expect(searchBar).toBeInTheDocument();
});
