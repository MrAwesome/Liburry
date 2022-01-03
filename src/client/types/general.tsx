export interface CancelablePromise<T> extends Promise<T> {
    cancel(): void,
}

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T

export type Nullable<T> = { [K in keyof T]: T[K] | null };
export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};
