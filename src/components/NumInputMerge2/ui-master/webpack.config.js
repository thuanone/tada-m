const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');
const nconf = require('@console/console-platform-nconf');

const prod = process.env.NODE_ENV === 'production';
const year = new Date().getFullYear();

const plugins = [];

console.log(prod ? 'Running PRODUCTION build' : 'Development build is ON');

if (prod) {
  plugins.push(
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.BannerPlugin({
      banner: fs.readFileSync('./copyright.txt', 'utf8').replace(/\${year}/g, year),
      raw: true,
    })
  );
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin());
}

if (process.env.ANALYZE_BUNDLE_SIZE === 'true') {
  plugins.push(new BundleAnalyzerPlugin());
}

const config = {
  mode: prod ? 'production' : 'development',
  devtool: prod ? 'source-maps' : 'inline-source-map',
  entry: {
    app: prod
      ? './src/client/view/app'
      : ['react-hot-loader/patch', 'webpack/hot/dev-server', 'webpack-hot-middleware/client', './src/client/view/app'],
  },
  resolve: {
    modules: ['src/client', 'node_modules', 'src/common'],
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
  },
  output: {
    // publicPath: process.env.TRAVIS ? undefined : `${nconf.get('proxyRoot')}js/`,
    publicPath: `${nconf.get('proxyRoot')}js/`,
    path: path.resolve(__dirname, 'dist/server/ts/public/js'),
    filename: prod ? '[name].bundle.[contenthash].js' : '[name].bundle.js',
    chunkFilename: prod ? '[name].bundle.[contenthash].js' : '[name].bundle.js',
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: prod ? 'babel-loader' : ['babel-loader', 'webpack-module-hot-accept'],
      }],
  },
  plugins,
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /\/node_modules\/(?!(@carbon|carbon|@console|react))/,
          chunks: 'all',
          name: 'vendor',
          enforce: true,
          priority: -10,
        },
        carbon: {
          test: /\/node_modules\/(carbon|@carbon)/,
          chunks: 'all',
          name: 'carbon',
          enforce: true,
          priority: -10,
        },
        console: {
          test: /\/node_modules\/@console/,
          chunks: 'all',
          name: 'console',
          enforce: true,
          priority: -10,
        },
        react: {
          test: /\/node_modules\/react/,
          chunks: 'all',
          name: 'react',
          enforce: true,
          priority: -10,
        },
      },
    },
    minimize: prod ? true : false,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
};

module.exports = config;
