import path from "path";
import nodeExternals from "webpack-node-externals";

import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const entry = {server: "./src/scripts/compileYaml.ts"};
const tsConfigLocation = "tsconfig.build.json";

export default {
  mode: "development",
  target: "node",
  devtool: "inline-source-map",
  entry: entry,
  output: {
    //chunkFormat: "module",
    path: path.resolve(__dirname, "build"),
    filename: "compileYaml.js",
  },
  resolve: {
    extensions: [".ts", ".tsx"],
    //fallback: { "path": "path-browserify", "fs" },
  },
  // don't compile node_modules
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: tsConfigLocation,
            },
          }
//          {
//            loader: 'babel-loader',
//            options: {
//              //sourceType: "module",
//              //sourceType: "script",
//              plugins: [
//
//                "@babel/plugin-proposal-nullish-coalescing-operator",
//              ],
//              presets: [
//                ["@babel/preset-env", {
//                    targets: {
//                      //esmodules: true,
//                      node: "current",
//                    },
//                    //modules: false,
//                    //debug: true,
//                    //useBuiltIns: "usage",
//                }],
//                "@babel/preset-typescript",
//                //["@babel/preset-typescript", {isTSX: true}]
//              ]
//            },
//          },
        ],
      },
    ],
  },
};

//
//     loaders: [
//    {
//      test: /\.json$/,
//      loaders: [
//        'json-loader'
//      ]
//    },
//    {
//      test: /\.js$/,
//      exclude: /node_modules/,
//      loader: 'eslint-loader',
//      enforce: 'pre'
//    },
//    {
//      test: /\.(css|scss)$/,
//      loaders: ExtractTextPlugin.extract({
//        fallback: 'style-loader',
//        use: 'css-loader?minimize!sass-loader!postcss-loader'
//      })
//    },
