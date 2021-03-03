const path = require('path')
const TerserJSPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [new TerserJSPlugin()],
  },
  devtool: 'source-map',
  target: 'web',
}
