import * as React from "react";
import ReactDOM from "react-dom";

import {ChhaTaigi} from "./ChhaTaigi";
import {ChhaTaigiPlayground} from "./ChhaTaigiPlayground";

import "./ChhaTaigi.css";
import "./pages.css";
import QueryStringHandler from "./QueryStringHandler";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
//import reportWebVitals from "./reportWebVitals";

const queryStringHandler = new QueryStringHandler();
const options = queryStringHandler.parse();

let app: JSX.Element;

if (options.playground) {
    app = <ChhaTaigiPlayground options={options}/>;
} else {
    app = <ChhaTaigi options={options}/>;
}

const rootElement = document.getElementById("root");
ReactDOM.render(
    <React.StrictMode>
        {app}
    </React.StrictMode>, rootElement);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
