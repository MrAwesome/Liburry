import type {CancelablePromise} from "./types/general";

export function noop(_: any) {}

// Wow.
export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

const RUNNING_IN_JEST = process.env.JEST_WORKER_ID !== undefined;
export function runningInJest() {
    return RUNNING_IN_JEST;
}

const RUNNING_IN_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string';
export function runningInNode() {
    return RUNNING_IN_NODE;
}

export function runningInProduction() {
    return process.env.NODE_ENV === "production";
}

export function getProtecc() {
    return (runningInJest() || runningInProduction())
            ? (f: Function) => f()
            : setTimeout;
}

export function nullGuard<T>(obj: T | undefined | null): obj is T {
    return !!obj;
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

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    return Object.values(rec).filter(v => v !== undefined).map(v => v as T);
}

export function getRecordEntries<T>(rec: Record<string, T | undefined>): Array<[string, T]> {
    return Object.entries(rec).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, v as T]);
}

export function reflectRecord<O extends Object | undefined, P extends string>(propName: P, obj: Record<string, O>): Record<string, O & {[p in P]: string}> {
    const ret: any = obj;
    Object.keys(obj).forEach((k) => {ret[k][propName] = k;});
    return ret;
}

export async function nodeReadFile(filename: string): Promise<string> {
    const fs = await import('fs');
    const {promisify} = await import('util');
    const readFile = promisify(fs.readFile);
    return readFile(filename).then(x => x.toString());
}

export async function nodeReadFileFromDir(dirname: string, filename: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    const {promisify} = await import('util');
    const readFile = promisify(fs.readFile);

    return readFile(path.join(dirname, filename)).then(x => x.toString());
}
