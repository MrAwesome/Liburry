import * as React from "react";
import ReactDOM from "react-dom";

import {ChhaTaigi} from "./ChhaTaigi";

import "./ChhaTaigi.css";
import "./pages.css";
import QueryStringHandler from "./QueryStringHandler";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
//import reportWebVitals from "./reportWebVitals";

const queryStringHandler = new QueryStringHandler();
const options = queryStringHandler.parse();

const rootElement = document.getElementById("root");
ReactDOM.render(
    <React.StrictMode>
        <ChhaTaigi options={options}/>
    </React.StrictMode>, rootElement);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
