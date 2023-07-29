"use strict"

const path = require("path")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const nodeExternals = require("webpack-node-externals")

module.exports = {
    mode: "development",
    entry: {
        bundle: path.resolve(__dirname, "src/app.ts"),
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    target: "node",
    devtool: false,
    module: {
        rules: [
            {
                // Compiling TypeScript with .ts extension
                test: /\.ts$/,
                use: "ts-loader",
            },
            {
                test: /\.js$/,
                loader: "webpack-remove-debug", // remove "debug" package
            },
        ],
    },
    resolve: {
        // To resolve the .ts and js file in the import statement
        extensions: [".ts", ".js"],
    },
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
    plugins: [new CleanWebpackPlugin()],
}
