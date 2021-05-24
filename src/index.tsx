import * as React from "react";
import ReactDOM from "react-dom";

import {ChaTaigi} from "./ChaTaigi";

import "./cha_taigi.css";
import "./pages.css";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
//import reportWebVitals from "./reportWebVitals";

const rootElement = document.getElementById("root");
ReactDOM.render(
    <React.StrictMode>
        <ChaTaigi />
    </React.StrictMode>, rootElement);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
