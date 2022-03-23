import { convertDBRowToFuzzySortPrepared } from "./fuzzySortUtils";
import {RawDBRow} from "./types/dbTypes";

test('preparation', () => {
    const row = {
        id: "40",
        poj: "A-le̍k-san-tāi",
        eng_us: "alexander! alexander!",
        trash: "throw away!",
    } as RawDBRow;

    const searchableKeys = ["poj", "eng_us"];

    const x = convertDBRowToFuzzySortPrepared(row, searchableKeys);

    expect(x).toHaveProperty("id");

    // TODO: test that prepped properties are added?
})
