"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChaMenu = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_burger_menu_1 = require("react-burger-menu");
class ChaMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentResultsElements: [],
            searchableDicts: [],
            ongoingSearches: [],
        };
        this.showSettings = this.showSettings.bind(this);
    }
    showSettings(event) {
        event.preventDefault();
        // TODO: show some settings
        // TODO: determine how to store them in localstorage (for now)
    }
    render() {
        return jsx_runtime_1.jsxs(react_burger_menu_1.slide, Object.assign({ right: true }, { children: [jsx_runtime_1.jsx("a", Object.assign({ id: "about", className: "menu-item", href: "/about" }, { children: "About" }), void 0),
                jsx_runtime_1.jsx("a", Object.assign({ id: "contact", className: "menu-item", href: "/contact" }, { children: "Contact" }), void 0),
                jsx_runtime_1.jsx("a", Object.assign({ onClick: this.showSettings, className: "menu-item--small", href: "" }, { children: "Settings" }), void 0)] }), void 0);
    }
}
exports.ChaMenu = ChaMenu;
