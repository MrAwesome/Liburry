type TypeEqualsWrapped<T> = T extends infer R & {}
    ? {
          [P in keyof R]: R[P]
      }
    : never

export type TypeEquals<A, B> = (<T>() => T extends TypeEqualsWrapped<A> ? 1 : 2) extends <
    T
>() => T extends TypeEqualsWrapped<B> ? 1 : 2
    ? true
    : false
