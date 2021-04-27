"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: make this use a GET flag
//const DEBUG_MODE = document.location.hostname === 'localhost';
const DEBUG_MODE = true;
class FakeConsole {
    time(_) { }
    timeEnd(_) { }
    log(..._) { }
}
const debugConsole = DEBUG_MODE ? console : new FakeConsole();
exports.default = debugConsole;
