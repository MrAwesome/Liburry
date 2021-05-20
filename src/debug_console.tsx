// TODO: make this use a GET flag
//const DEBUG_MODE = document.location.hostname === 'localhost';

function getDebugMode(): boolean {
    try {
        return document.location.hash.includes("enabledebug");
    } catch {
        return false;
    }
}

export const DEBUG_MODE = getDebugMode();

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

const debugConsole: StubConsole = DEBUG_MODE ? console : new FakeConsole();
export const getWorkerDebugConsole: (x: boolean) => StubConsole = (x: boolean) => x ? console : new FakeConsole();

export default debugConsole;
