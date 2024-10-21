const { resolve: _resolve } = require("path");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  output: {
    filename: "bundle.js",
    path: _resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  mode: "production",
};
