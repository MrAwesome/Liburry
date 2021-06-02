import QueryStringHandler from "./QueryStringHandler";

export interface StubConsole {
    time(label?: string): void;
    timeLog(label?: string, ...data: any[]): void;
    timeEnd(label?: string): void;
    log(...data: any[]): void;
}

class FakeConsole implements StubConsole {
    time(_: string) {}
    timeLog(_l?: string, ..._d: any[]) {}
    timeEnd(_: string) {}
    log(..._: any[]) {}
}

export default function getDebugConsole(x: boolean): StubConsole {
    return x ? console : new FakeConsole();
}


// NOTE: this function will not work in any context where "window" is not
//       available, aka inside of web workers.
export function getDebugConsoleBasedOnQueryString(): StubConsole {
    let queryStringHandler = new QueryStringHandler();
    let options = queryStringHandler.parse();
    return getDebugConsole(options.debug);
}
