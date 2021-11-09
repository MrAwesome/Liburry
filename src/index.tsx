import * as React from "react";
import * as ReactDOM from 'react-dom';

import "./ChhaTaigi.css";
import QueryStringHandler from "./QueryStringHandler";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import MuhErrorBoundary from "./errorHandling/MuhErrorBoundary";
import {ChhaTaigiPlayground} from "./ChhaTaigiPlayground";
//import reportWebVitals from "./reportWebVitals";

const queryStringHandler = new QueryStringHandler();
const options = queryStringHandler.parse();

let app: JSX.Element;

if (options.playground) {
    app = <ChhaTaigiPlayground options={options}/>;
} else {
    app = <MuhErrorBoundary options={options}/>
}

const rootElement = document.getElementById("root");
const root = (ReactDOM as any).createRoot(rootElement);

root.render(
    <React.StrictMode>
        {app}
    </React.StrictMode>);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
