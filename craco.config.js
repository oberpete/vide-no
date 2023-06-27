const CopyPlugin = require("copy-webpack-plugin");
const CracoCSSModules = require('craco-css-modules');

module.exports = {
  plugins: [
    {
      plugin: CracoCSSModules,
    }
  ],
  webpack: {
    plugins: {
      add: [
        new CopyPlugin({
          // Use copy plugin to copy *.wasm to output folder.
          patterns: [
            { from: "node_modules/onnxruntime-web/dist/*.wasm", to: "static/js/[name][ext]" },
            { from: "node_modules/pdfjs-dist/build/pdf.worker.min.js", to: "static/js/pdf.worker.min.js" },
          ],
        }),
        
      ],
    },
    configure: (config) => {
      // set resolve.fallback for opencv.js
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
      return config;
    },
  },
};
