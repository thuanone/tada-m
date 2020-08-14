// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['<rootDir>/src/client/**/*.{ts,tsx}'],

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage/client',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/client/__tests__/',
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'text-summary',
  ],

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    'src/client',
    'node_modules',
  ],

  // For production use we import the es modules from carbon and other libs, but jest requires
  // the commonjs versions of those modules.
  moduleNameMapper: {
    '^carbon-components-react/es/(.*)$': 'carbon-components-react/lib/$1',
    '^carbon-addons-cloud-react/es/(.*)$': 'carbon-addons-cloud-react/lib/$1',
    '^carbon-addons-catalog-react/es/(.*)$': 'carbon-addons-catalog-react/cjs/$1',
    '^@console/console-components-react/es/(.*)$': '@console/console-components-react/lib/$1',
    '^@console/pal/Components/(.*)$': '@console/pal/Components/lib/$1',
  },

  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './reports/test', outputName: 'client-unit-tests.xml' }],
  ],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/config/jest/setup.js'],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    // '<rootDir>/test/specs/**/*.test.{js,jsx}',
    '<rootDir>/src/client/__tests__/specs/**/*.{js,jsx}',
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: false,
};
