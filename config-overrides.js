const exec = require('child_process').exec;
const CopyPlugin = require("copy-webpack-plugin");
const {IgnorePlugin} = require("webpack");

module.exports = {
  webpack: function (config, env) {
    config.resolve.fallback = config.resolve.fallback ?? {};
    config.resolve.fallback['path'] = false;
    config.resolve.fallback['util'] = false;

    config.plugins.push(
      {
        // TODO: do not run this if the only changed files in dev mode are css
        apply: (compiler) => {
          compiler.hooks.watchRun.tap('CompileLiburryYaml', (comp) => {

            if (comp.modifiedFiles) {
              const changedFiles = Array.from(comp.modifiedFiles);
              const requireChangeFiles = changedFiles.filter((filename) =>
                !(
                  filename.includes('src/generated/') ||
                  filename.endsWith('.css')
                )
              );
              if (requireChangeFiles.length < 1) {
                return;
              }
            }

            if (process.env.BYPASS_YAML === "1") {
              return;
            }
            // This is run here to allow yaml configs to be recompiled in dev mode. There's an initial run in
            // "prebuild" in package.json which is necessary for the assets to be included in builds.
            // The typescript compilation is unchecked, since the ts files in question are typechecked
            // during our normal builds and not re-checking them saves ~6 seconds per run.
            exec('yarn run ts-node src/scripts/compileYaml.ts', (err, stdout, stderr) => {
              if (stdout) process.stdout.write(stdout);
              if (stderr) process.stderr.write(stderr);
              if (err) {
                console.error("====== YAML COMPILATION FAILED ======");
                if (process.env.NODE_ENV === "development") {
                  console.error(err);
                } else {
                  throw err;
                }

              }
            });
          });
        }
      },
    );

    config.plugins.push(new CopyPlugin(
      {
        // TODO: find a better way to watch yml files
        patterns: [{
          from: "src/config/**/*.yml",
          to: "yaml_was_watched",

          //          transformAll: (assets) => {
          //            const out = {};
          //            assets.forEach((ass) => {
          //              const idChain = ass.sourceFilename.split('src/config/')[1].split('/');
          //              const idc = [...idChain];
          //              let targ = out;
          //              while (idc.length > 1) {
          //                const id = idc.shift();
          //                if (!(id in targ)) {
          //                  targ[id] = {};
          //                }
          //                targ = targ[id];
          //              }
          //              const filename = idc.shift();
          //              targ[filename] = yaml.parse(ass.data.toString());
          //            });

          //return JSON.stringify(out);
          //}
        }]
      }
    ));

    config.plugins.push(new IgnorePlugin(
      {resourceRegExp: /^fs$/}
    ));
    return config;
  },
  jest: function (config) {
    return config;
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      //config.watchFiles = [...(config.watchFiles ?? []), "src/config/**/*.yml"];
      return config;
    };
  },
  paths: function (paths, env) {
    return paths;
  },
}
