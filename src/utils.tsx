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
