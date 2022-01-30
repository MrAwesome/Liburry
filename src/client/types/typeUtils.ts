export type ValueOf<T> = T[keyof T];

export type WriteableType<T> = { -readonly [P in keyof T]-?: T[P] };
