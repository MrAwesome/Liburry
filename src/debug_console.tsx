// TODO: make this use a GET flag
const DEBUG_MODE = document.location.hostname === 'localhost';

interface StubConsole {
    time(label?: string): void;
    timeEnd(label?: string): void;
    log(...data: any[]): void;
}

class FakeConsole implements StubConsole {
    time(_: string) {}
    timeEnd(_: string) {}
    log(..._: any[]) {}
}

const debugConsole: any = DEBUG_MODE ? console : new FakeConsole();

export default debugConsole;
