import * as React from "react";
import ReactDOM from "react-dom";

import {ChaTaigi} from "./ChaTaigi";

import "./ChaTaigi.css";
import getDebugConsole from "./getDebugConsole";
import "./pages.css";
import QueryStringHandler from "./QueryStringHandler";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
//import reportWebVitals from "./reportWebVitals";

const queryStringHandler = new QueryStringHandler();
const options = queryStringHandler.parse();
const debugConsole = getDebugConsole(options.debug);
debugConsole.time("initToAllDB");

const rootElement = document.getElementById("root");
ReactDOM.render(
    <React.StrictMode>
        <ChaTaigi options={options}/>
    </React.StrictMode>, rootElement);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
