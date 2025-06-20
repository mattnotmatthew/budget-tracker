const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        "fs/promises": false,
        path: require.resolve("path-browserify"),
        https: require.resolve("https-browserify"),
        http: require.resolve("stream-http"),
        url: require.resolve("url/"),
        buffer: require.resolve("buffer"),
        util: require.resolve("util/"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        vm: require.resolve("vm-browserify"),
        os: require.resolve("os-browserify/browser"),
        querystring: require.resolve("querystring-es3"),
        zlib: require.resolve("browserify-zlib"),
        assert: require.resolve("assert/"),
        constants: require.resolve("constants-browserify"),
      };

      // Add plugins to provide globals
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ];

      return webpackConfig;
    },
  },
};
