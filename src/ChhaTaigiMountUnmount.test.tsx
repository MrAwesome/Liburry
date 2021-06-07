import {ChhaTaigi} from './ChhaTaigi';
import { render } from '@testing-library/react';
import SearchController from './SearchController';

test('test SearchController start/cleanup', () => {
    let startW = jest.spyOn(SearchController.prototype, 'startWorkersAndListener');
    let endW = jest.spyOn(SearchController.prototype, 'cleanup');
    let x = render(<ChhaTaigi />);
    expect(startW).toHaveBeenCalledTimes(1);
    expect(endW).toHaveBeenCalledTimes(0);
    x.unmount();
    expect(startW).toHaveBeenCalledTimes(1);
    expect(endW).toHaveBeenCalledTimes(1);
});

test('test hashchange listen/end', () => {
    let startH = jest.spyOn(ChhaTaigi.prototype, 'subscribeHash');
    let endH = jest.spyOn(ChhaTaigi.prototype, 'unsubscribeHash');
    let x = render(<ChhaTaigi />);
    expect(startH).toHaveBeenCalledTimes(1);
    expect(endH).toHaveBeenCalledTimes(0);
    x.unmount();
    expect(startH).toHaveBeenCalledTimes(1);
    expect(endH).toHaveBeenCalledTimes(1);
});
