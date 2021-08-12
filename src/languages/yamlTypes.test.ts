import {RawDialect, RawLangConfig} from "./yamlTypes";
import {loadTestYaml} from "../utils/yaml";

test('parse test config', async () => {
    const testDataFilename = "src/languages/testData/validConfig.yml";
    const rawDialects: RawLangConfig = await loadTestYaml(testDataFilename);
    //validateRawLangConfigs([rawDialects]);
    for (const dialectID in rawDialects.dialects) {
        const dialect = rawDialects.dialects[dialectID];
        expect(dialect).toBe<RawDialect>(dialect);
    }
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
            expect(dialect.displayName).toBeInstanceOf(String);
            expect(dialect.displayName).toBeTruthy();
        }
    });
}

