import { convertDBRowToFuzzySortPrepared } from "./fuzzySortUtils";
import {DBRow} from "./types/dbTypes";

test('preparation', () => {
    const row = {
        id: "40",
        poj: "A-le̍k-san-tāi",
        english: "alexander! alexander!",
        trash: "throw away!",
    } as DBRow;

    const searchableKeys = ["poj", "english"];

    let x = convertDBRowToFuzzySortPrepared(row, searchableKeys);

    expect(x).toHaveProperty("id");

    // TODO: test that prepped properties are added?
})
