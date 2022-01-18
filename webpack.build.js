const path = require("path");
//const spawn = require('child_process').spawn;
const nodeExternals = require("webpack-node-externals");

const entry = { server: "./src/scripts/compileYaml.ts" };
const tsConfigLocation = "tsconfig.build.json";

module.exports = {
  mode: process.env.NODE_ENV ? process.env.NODE_ENV : "development",
  target: "node",
  devtool: "inline-source-map",
  entry: entry,
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "compileYaml.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
    // don't compile node_modules
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: tsConfigLocation,
            },
          },
        ],
      },
//      {
//        test: /\.ya?ml$/,
//        type: 'json',
//        use: [
//          {
//            loader: "yaml-loader",
//          },
//        ],
//      },
    ],
  },
//  plugins: [
//    {
//      apply: (compiler) => {
//        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
//          const bin = path.join(compilation.options.output.path, compilation.options.output.filename);
//
//          const child = spawn("node", [bin]);
//          child.stdout.on('data', function (data) {
//              process.stdout.write(data);
//          });
//          child.stderr.on('data', function (data) {
//              process.stderr.write(data);
//          });
//        });
//      }
//    }
//  ],
};
