// Wow.
export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function runningInJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}

