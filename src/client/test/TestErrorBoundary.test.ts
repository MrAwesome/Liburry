import {render, screen, waitFor} from '@testing-library/react';
import MuhErrorBoundary from "../errorHandling/MuhErrorBoundary";
import * as React from 'react';
import {ChhaTaigiLoader} from '../ChhaTaigiLoader';
import CompiledJSONFinalConfigHandler from '../configHandler/CompiledJSONFinalConfigHandler';

test('render entire app', async () => {
    // Add a "load from local yaml" option for confighandler, and use that?
    const configLoader = new CompiledJSONFinalConfigHandler({
    });
//    const app = <MuhErrorBoundary>
//        <ChhaTaigiLoader />
//    </MuhErrorBoundary>
//    render(app,
//        // @ts-ignore
//        {legacyRoot: true}
//    );
//
//    await waitFor(() => {
//        const yee = screen.queryByText("FUCK");
//        expect(yee).not.toBeNull();
//    });
});
