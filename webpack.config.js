const path = require('path')
const webpack = require('webpack')
const pkg = require('./package.json')

module.exports = [
  {
    entry: './index.js',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'paydata.bundle.js',
      library: {
        name: 'bsv',
        type: 'umd2'
      }
    },
    resolve: {
      fallback:{
       "crypto": require.resolve("crypto-browserify"),
       "stream": require.resolve("stream-browserify")
      },
      alias: {
        process: 'process/browser'
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    ],
    devtool: 'source-map',
    mode: 'production'
  },
  {
    entry: './index.js',
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'paydata.module.js',
      library: {
        type: 'commonjs-module'
      }
    },
    devtool: 'source-map',
    mode: 'production'
  },
  {
    entry: './index.js',
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'paydata.cjs.js',
      library: {
        type: 'commonjs2'
      }
    },
    devtool: 'source-map',
    mode: 'production'
  }
]
