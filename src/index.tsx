import * as React from "react";
import * as ReactDOM from 'react-dom';

import "./ChhaTaigi.css";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import MuhErrorBoundary from "./errorHandling/MuhErrorBoundary";
//import reportWebVitals from "./reportWebVitals";



const rootElement = document.getElementById("root");
const root = (ReactDOM as any).createRoot(rootElement);

root.render(
    <React.StrictMode>
        <MuhErrorBoundary />
    </React.StrictMode>);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
