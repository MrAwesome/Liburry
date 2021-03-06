const path = require("path");
const nodeExternals = require("webpack-node-externals");

const entry = { server: "./src/scripts/serverSideCSVProcessor.ts" };
const tsConfigLocation = "tsconfig.scripts.json";

module.exports = {
  mode: process.env.NODE_ENV ? process.env.NODE_ENV : "development",
  target: "node",
  devtool: "inline-source-map",
  entry: entry,
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
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
    ],
  },
};
