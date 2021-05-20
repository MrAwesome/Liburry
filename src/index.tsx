import * as React from "react";
import ReactDOM from "react-dom";

import debugConsole from "./debug_console";
import {ChaTaigi} from "./ChaTaigi";

import "./cha_taigi.css";
import "./menu.css";

//import {ChaMenu} from "./cha_menu";

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
//import reportWebVitals from "./reportWebVitals";

debugConsole.time("initToAllDB");
const rootElement = document.getElementById("root");
ReactDOM.render(
    <React.StrictMode>
        <ChaTaigi />
    </React.StrictMode>, rootElement);

serviceWorkerRegistration.register();
//reportWebVitals(console.log);
