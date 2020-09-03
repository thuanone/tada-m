{
    test: /\.(t|j)sx?$/,
    use: { loader: ‘awesome-typescript-loader’ } },
  {
    enforce: ‘pre’,
    test: /\.js$/,
    loader: ‘source-map-loader’ },
  }