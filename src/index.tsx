import * as React from "react";
import * as ReactDOM from 'react-dom';

import "setimmediate";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import MuhErrorBoundary from "./client/errorHandling/MuhErrorBoundary";
//import reportWebVitals from "./client/reportWebVitals";
import ReactModal from 'react-modal';

const rootElement = document.getElementById("root");
ReactModal.setAppElement('#root');
const root = (ReactDOM as any).createRoot(rootElement);

root.render(
    <React.StrictMode>
        <MuhErrorBoundary />
    </React.StrictMode>);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
