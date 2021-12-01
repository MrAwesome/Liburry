export function typeGuard<T>(x: T | null | undefined): boolean {
    return !!x;
}

