const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
  mode: isProduction ? "production" : "development",
  devtool: isProduction ? false : "inline-source-map",
  entry: {
    popup: "./extension/index.tsx",
    background: "./extension/background.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.extension.json",
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "public/manifest.json", to: "manifest.json" },
        { from: "extension/popup.html", to: "popup.html" },
        { from: "public/icon16.png", to: "icon16.png" },
        { from: "public/icon48.png", to: "icon48.png" },
        { from: "public/icon128.png", to: "icon128.png" },
      ],
    }),
  ],
  };
};
