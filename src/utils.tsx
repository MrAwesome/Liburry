import {CancelablePromise} from "./types/general";

// Wow.
export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

export function runningInJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}


export function makeCancelable<T>(promise: Promise<T>): CancelablePromise<T> {
    let isCanceled = false;

    const wrappedPromise =
        new Promise((resolve, reject) => {
            promise
                .then((val) => (isCanceled ? reject({isCanceled}) : resolve(val)))
                .catch((error) => (isCanceled ? reject({isCanceled}) : reject(error)));
        });

    return {
        ...wrappedPromise,
        cancel() {
            isCanceled = true;
        },
    } as CancelablePromise<T>;
}
