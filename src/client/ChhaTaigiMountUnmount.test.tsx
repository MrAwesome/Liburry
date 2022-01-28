import * as React from 'react';
import {ChhaTaigi} from './ChhaTaigi';
import { render } from '@testing-library/react';
import SearchController from "./search/orchestration/SearchController";
import {noop} from './utils';
import OptionsChangeableByUser from './ChhaTaigiOptions';
import {genLoadFinalConfigWILLTHROW} from '../scripts/compileYamlLib';

// NOTE: just used to silence errors in node TSC.
noop(React.version);

test('SearchController start/cleanup', async () => {
    let startW = jest.spyOn(SearchController.prototype, 'startWorkersAndListener');
    let endW = jest.spyOn(SearchController.prototype, 'cleanup');

    const rfc = await genLoadFinalConfigWILLTHROW();
    let options = new OptionsChangeableByUser();
    let x = render(<ChhaTaigi rfc={rfc} mockOptions={options} />);

    expect(startW).toHaveBeenCalledTimes(1);
    expect(endW).toHaveBeenCalledTimes(0);
    x.unmount();
    expect(startW).toHaveBeenCalledTimes(1);
    expect(endW).toHaveBeenCalledTimes(1);
});

test('hashchange listen/end', async () => {
    let startH = jest.spyOn(ChhaTaigi.prototype, 'subscribeHash');
    let endH = jest.spyOn(ChhaTaigi.prototype, 'unsubscribeHash');

    const rfc = await genLoadFinalConfigWILLTHROW();
    let options = new OptionsChangeableByUser();
    let x = render(<ChhaTaigi rfc={rfc} mockOptions={options} />);

    expect(startH).toHaveBeenCalledTimes(1);
    expect(endH).toHaveBeenCalledTimes(0);
    x.unmount();
    expect(startH).toHaveBeenCalledTimes(1);
    expect(endH).toHaveBeenCalledTimes(1);
});
