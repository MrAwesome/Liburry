import {render, screen, waitFor} from '@testing-library/react';
import MuhErrorBoundary from "../errorHandling/MuhErrorBoundary";
import * as React from 'react';
import {ChhaTaigiLoader} from '../ChhaTaigiLoader';
import {genLoadFinalConfigWILLTHROW} from '../../scripts/compileYamlLib';
import {noop} from '../utils';

// buildID?: BuildID,
// appIDsOverride?: AppIDListOrAll,
// initialAppOverride?: AppID,

noop(React.version);

test('ensure error boundary fires', async () => {
    // We're expecting console errors for uncaught error we'll be throwing.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const configHandler = {genLoadFinalConfig: () => genLoadFinalConfigWILLTHROW({buildID: "test/basic"})}
    const app = <MuhErrorBoundary>
        <ChhaTaigiLoader
            configHandler={configHandler}
            shouldBailForTest={true}
        />
    </MuhErrorBoundary>

    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    screen.getByText("EXPLICIT_FAILURE_REQUESTED");
});

test('check that app loads', async () => {
    const configHandler = {genLoadFinalConfig: () => genLoadFinalConfigWILLTHROW({buildID: "test/basic"})}
    const app = <MuhErrorBoundary>
        <ChhaTaigiLoader 
            configHandler={configHandler} 
        />
    </MuhErrorBoundary>

    render(app,
        // @ts-ignore
        {legacyRoot: true}
    );

    await waitFor(() => {
        screen.getByPlaceholderText("Search...");
    });
});
