export interface CancelablePromise<T> extends Promise<T> {
    cancel(): void,
}

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T
