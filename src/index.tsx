import * as React from "react";
import * as ReactDOM from 'react-dom';

import "setimmediate";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import MuhErrorBoundary from "./client/errorHandling/MuhErrorBoundary";
//import reportWebVitals from "./client/reportWebVitals";
import ReactModal from 'react-modal';


import {ChhaTaigiLoader} from "./client/ChhaTaigiLoader";

const rootElement = document.getElementById("root");
ReactModal.setAppElement('#root');

// Not available yet in typings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const root = (ReactDOM as any).createRoot(rootElement);

root.render(
    <React.StrictMode>
        <MuhErrorBoundary>
            <ChhaTaigiLoader />
        </MuhErrorBoundary>
    </React.StrictMode>);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
