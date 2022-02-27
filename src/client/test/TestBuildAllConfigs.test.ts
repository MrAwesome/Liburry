import {genLoadFinalConfigWILLTHROW} from '../../scripts/compileYamlLib';

// TODO: more sane errors for zod/yaml? show paths?

test('[!!!] build ALL non-test configs', async () => {
    const rfc = await genLoadFinalConfigWILLTHROW({appIDsOverride: "all"});
    // Sanity check that a couple known apps are built:
    expect(rfc.appConfigs["taigi.us"]!.configs.appConfig.config.displayName).toBe("Chhâ Tâi-gí!");
    expect(rfc.appConfigs["HakkaTW"]!.configs.dbConfig.config.enabledDBs).toHaveProperty("sixian_subapp");
});
