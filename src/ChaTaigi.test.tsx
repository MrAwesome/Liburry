import { render, screen } from '@testing-library/react';
import {MainDisplayAreaMode} from "./types/displayTypes";
import {ChaTaigi} from './ChaTaigi';
import {PerDictResults, SearchResultEntry} from './types/dbTypes';

test('render single entry via override', () => {
    let res1 = {
        key: "malee-1",
        dbID: 0,
        dbName: "malee",
        dbSearchRanking: -3,
        pojUnicodeText: "hoat-lu̍t",
        pojUnicode: "hoat-lu̍t",
        pojInput: "hoat-lut8",
        hoabun: "法律",
        pojNormalized: "hoat-lut",
        definition: "the law",
    } as SearchResultEntry;

    let perDictRes = {
        dbName: "malee",
        results: [res1],
    } as PerDictResults;

    render(<ChaTaigi mockResults={perDictRes} modeOverride={MainDisplayAreaMode.SEARCH} />);

    const hoabun = screen.getByText(/法律/i);
    expect(hoabun).toBeInTheDocument();
    const poj = screen.getByText(/hoat-lu̍t/i);
    expect(poj).toBeInTheDocument();
    const eng = screen.getByText(/the law/i);
    expect(eng).toBeInTheDocument();
    const db = screen.getByText(/malee/i);
    expect(db).toBeInTheDocument();
});
