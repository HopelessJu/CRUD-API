import { resolve as _resolve } from "path";

export const entry = "./src/index.ts";
export const target = "node";
export const output = {
  filename: "bundle.js",
  path: _resolve(__dirname, "dist"),
};
export const resolve = {
  extensions: [".ts", ".js"],
};
export const module = {
  rules: [
    {
      test: /\.ts$/,
      use: "ts-loader",
      exclude: /node_modules/,
    },
  ],
};
export const mode = "production";
