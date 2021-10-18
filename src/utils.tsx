import type {CancelablePromise} from "./types/general";

export function noop(_: any) {}

// Wow.
export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

export function runningInJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}


export function makeCancelable<T>(promise: Promise<T>): CancelablePromise<T> {
    let isCanceled = false;

    const wrappedPromise: Partial<CancelablePromise<T>> =
        new Promise((resolve, reject) => {
            promise
                .then((val) => (!isCanceled && resolve(val)))
                .catch((error) => (!isCanceled && reject(error)));
        });

    wrappedPromise.cancel = () => {isCanceled = true;};

    return wrappedPromise as CancelablePromise<T>;
}

// TODO: make this more generic for places where it's needed
interface HasName {shortName: string}

export function makeNameToObjMapping<Obj extends HasName>(fields: Obj[]): Map<string, Obj> {
    const nameToFields: [string, Obj][] = fields.map((field) => ([field.shortName, field]));
    return new Map(nameToFields);
}

// Useragent is not a great way to detect whether or not we're on mobile, but it's fast and easy.
// This should not be relied on for core functionality, but small affordances/functionality are fine.
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function getRecordValues<T>(rec: Record<string, T | undefined>): Array<T> {
    return Object.values(rec).filter(v => v !== undefined).map(v => v as T);;
}

export function getRecordEntries<T>(rec: Record<string, T | undefined>): Array<[string, T]> {
    return Object.entries(rec).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, v as T]);;
}
