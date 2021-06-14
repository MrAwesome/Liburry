// TODO: generalize
export interface UnpreparedDBEntry {
    id: number,
    poj_unicode: string,
    poj_input: string,
    english: string,
    hoabun: string,
}

export interface DBEntry {
    id: number,
    poj_unicode: string,
    poj_normalized: string,
    poj_input: string,
    english: string,
    hoabun: string,
}
