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
