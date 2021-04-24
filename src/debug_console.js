"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: make this use a GET flag
var DEBUG_MODE = true;
var FakeConsole = /** @class */ (function () {
    function FakeConsole() {
    }
    FakeConsole.prototype.time = function (_) { };
    FakeConsole.prototype.timeEnd = function (_) { };
    FakeConsole.prototype.log = function () {
        var _ = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _[_i] = arguments[_i];
        }
    };
    return FakeConsole;
}());
var debugConsole = DEBUG_MODE ? console : new FakeConsole();
exports.default = debugConsole;
