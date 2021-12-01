import * as React from 'react';
import {ChhaTaigi} from './ChhaTaigi';
import { render } from '@testing-library/react';
import SearchController from './SearchController';
import {noop} from './utils';
import {genAppConfig} from './ChhaTaigi.test';
import OptionsChangeableByUser from './ChhaTaigiOptions';

// NOTE: just used to silence errors in node TSC.
noop(React.version);

const appConfigPromise = genAppConfig();

test('SearchController start/cleanup', async () => {
    let startW = jest.spyOn(SearchController.prototype, 'startWorkersAndListener');
    let endW = jest.spyOn(SearchController.prototype, 'cleanup');

    const appConfig = await appConfigPromise;
    let options = new OptionsChangeableByUser();
    let x = render(<ChhaTaigi appConfig={appConfig} mockOptions={options} />);

    expect(startW).toHaveBeenCalledTimes(1);
    expect(endW).toHaveBeenCalledTimes(0);
    x.unmount();
    expect(startW).toHaveBeenCalledTimes(1);
    expect(endW).toHaveBeenCalledTimes(1);
});

test('hashchange listen/end', async () => {
    let startH = jest.spyOn(ChhaTaigi.prototype, 'subscribeHash');
    let endH = jest.spyOn(ChhaTaigi.prototype, 'unsubscribeHash');

    const appConfig = await appConfigPromise;
    let options = new OptionsChangeableByUser();
    let x = render(<ChhaTaigi appConfig={appConfig} mockOptions={options} />);

    expect(startH).toHaveBeenCalledTimes(1);
    expect(endH).toHaveBeenCalledTimes(0);
    x.unmount();
    expect(startH).toHaveBeenCalledTimes(1);
    expect(endH).toHaveBeenCalledTimes(1);
});
