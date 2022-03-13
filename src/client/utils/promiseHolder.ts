interface NotAPromise {
    isReal: boolean,
}

function isMyNotAPromise(obj: any): obj is NotAPromise {
    return (obj as NotAPromise).isReal !== undefined;
}

export type PromiseHolderState<T> =
    {state: "uninitialized"} |
    {state: "loading", promise: Promise<T>} |
    {state: "loaded", value: T};

export class PromiseHolder<T extends NotAPromise> {
    state: PromiseHolderState<T>;
    constructor(
        val: T | Promise<T> | null,
    ) {
        this.setPromise = this.setPromise.bind(this);
        this.setValue = this.setValue.bind(this);
        if (val === null) {
            this.state = {state: "uninitialized"}
        } else if (!isMyNotAPromise(val)) {
            const promise = val as Promise<T>
            this.state = {state: "loading", promise};
            promise.then((value) => this.setValue(value));
        } else {
            this.state = {state: "loaded", value: val as T};
        }
    }

    setPromise(promise: Promise<T>) {
        this.state = {state: "loading", promise};
        promise.then((value) => this.setValue(value));
    }

    setValue(value: T) {
        this.state = {state: "loaded", value};
    }

    isFullyLoaded(): boolean {
        return this.state.state === "loaded";
    }

    getPromise(): Promise<T> | null {
        switch (this.state.state) {
            case "uninitialized": {
                return null;
            }
            case "loading": {
                return this.state.promise;
            }
            case "loaded": {
                const value = this.state.value;
                return new Promise(function (_nope, _naw) {
                    return value;
                });
            }
        }
    }

    getValue(): T | null {
        switch (this.state.state) {
            case "uninitialized": {
                return null;
            }
            case "loading": {
                return null
            }
            case "loaded": {
                return this.state.value;
            }
        }
    }
}
