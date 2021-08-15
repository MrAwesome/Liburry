import {RawLangConfig} from "./rawConfigTypes";
import {loadTestYaml} from "../utils/yaml";

test('parse test config', async () => {
    const testDataFilename = "src/languages/testData/validConfig.yml";
    const rawLangConfig: RawLangConfig = await loadTestYaml(testDataFilename);

    const d = rawLangConfig.dialects;
    const f1d1 = d["fake1_dialect1"];
    expect(f1d1.displayName).toEqual("FAKE1 (DIALECT1)");
    if (f1d1.namesForOtherDialects !== undefined) {
        expect(f1d1.namesForOtherDialects["fake2_dialect1"]).toContain("F1D1_F2D1");
        expect(f1d1.namesForOtherDialects["fake2_dialect2"]).toContain("F1D1_F2D2");
    } else {
        throw "namesForOtherDialects not defined!";
    }

    const f2d1 = d["fake2_dialect1"];
    expect(f2d1.displayName).toEqual("FAKE2 (DIALECT1)");
    if (f2d1.namesForOtherDialects !== undefined) {
        expect(f2d1.namesForOtherDialects["fake1_dialect1"]).toContain("F2D1_F1D1");
        expect(f2d1.namesForOtherDialects["fake2_dialect2"]).toContain("F2D1_F2D2");
    } else {
        throw "namesForOtherDialects not defined!";
    }

    const f2d2 = d["fake2_dialect2"];
    expect(f2d2.displayName).toEqual("FAKE2 (DIALECT2)");
    if (f2d2.namesForOtherDialects !== undefined) {
        expect(f2d2.namesForOtherDialects["fake1_dialect1"]).toContain("F2D2_F1D1");
        expect(f2d2.namesForOtherDialects["fake2_dialect1"]).toContain("F2D2_F2D1");
    } else {
        throw "namesForOtherDialects not defined!";
    }
});

test('validate test config', async () => {
    const testDataFilename = "src/languages/testData/validConfig.yml";
    const rawLangConfig: RawLangConfig = await loadTestYaml(testDataFilename);
    validateRawLangConfigs([rawLangConfig]);
});


// TODO: throw/assert instead
export function validateRawLangConfigs(rawLangConfigs: RawLangConfig[]) {
    //const seenLanguageGroupIDs = new Set<string>();
    // TODO: check tags are in allowedtags
    //
    rawLangConfigs.forEach((r) => {
        // if (r.languageGroups !== undefined) {
        //     for (const langGroupID in r.languageGroups) {
        //         if (typeof langGroupID !== "string") {
        //             throw `langGroupID is not a string: ${langGroupID}`;
        //         } else {
        //             seenLanguageGroupIDs.add(langGroupID);
        //             const langGroup = r.languageGroups[langGroupID];
        //             if (!langGroup.defaultDialect) {
        //                 throw `defaultDialect not defined on: ${langGroupID}`;
        //             }
        //             if (!langGroup.nameInDefaultDialect) {
        //                 throw `nameInDefaultDialect not defined on: ${langGroupID}`;
        //             }
        //             //validateRawLangGroup(langGroup);
        //         }
        //     }
        // }

        // if (r.allowedTags !== undefined) {
        //     for (const tagName in r.allowedTags) {
        //         const tag = r.allowedTags[tagName];
        //     }
        // }

        for (const dialectID in r.dialects) {
            const dialect = r.dialects[dialectID];
            expect(typeof dialect.displayName).toBe("string");
            expect(dialect.displayName).toBeTruthy();
            if (dialect.namesForOtherDialects !== undefined) {
                expect(typeof dialect.namesForOtherDialects).toBe("object");
            }
        }
    });
}
