module.exports = {
  presets: [
    '@babel/preset-react',
    [
      '@babel/preset-env',
      {
        targets: '> 0.25%, not dead',
      },
    ],
  ],
  env: {
    test: {
      plugins: [
        'babel-plugin-transform-class-properties',
        '@babel/plugin-transform-runtime',
        '@babel/syntax-dynamic-import',
        'dynamic-import-node',
      ],
    },
    development: {
      plugins: [
        'babel-plugin-transform-class-properties',
        '@babel/plugin-transform-runtime',
        '@babel/syntax-dynamic-import',
        'react-hot-loader/babel',
      ],
    },
    production: {
      plugins: [
        'babel-plugin-transform-class-properties',
        '@babel/plugin-transform-runtime',
        '@babel/syntax-dynamic-import',
        'transform-react-remove-prop-types',
      ],
    },
  },
};
