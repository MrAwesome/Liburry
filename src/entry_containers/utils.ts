export class FieldTypeToAreaConverter<FT, DA> {
    private fieldToAreaMap: Map<FT, DA>;
    constructor(
        pairs: Array<[FT, DA]>,
    ) {
        this.fieldToAreaMap = new Map(pairs);
    }

    getArea(fieldType: FT): DA | null {
        return this.fieldToAreaMap.get(fieldType) ?? null;
    }
}

