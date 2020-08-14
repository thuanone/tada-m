// Set up the environment variables before getting into nightwatch config
process.env.CHROME_ARGS = '--no-sandbox --window-size=1536,1152 --no-default-browser-check --disable-dev-shm-usage';
if (process.env.CONSOLE_PROXY) {
  process.env.CHROME_ARGS = `${process.env.CHROME_ARGS} --proxy-server=${process.env.CONSOLE_PROXY}`;
}

const accountId = process.env.E2E_TEST_ACCOUNT;
const accountName = 'IBM';

const config = {
  src_folders: './src/e2e/run.js',
  output_folder: './reports/test',
  custom_commands_path: './src/e2e/commands',
  custom_assertions_path: './src/e2e/assertions',
  page_objects_path: './src/e2e/pageobjects',
  globals_path: '',
  skip_testcases_on_fail: true,
  webdriver: {
    start_process: true,
    server_path: './node_modules/.bin/chromedriver',
    log_path: './reports/test',
    port: 9515,
    host: 'localhost',
  },
  test_settings: {
    default: {
      'launch_url': process.env.CONSOLE_URL || 'http://localhost:3000',
      silent: true,
      screenshots: {
        enabled: true,
        path: './reports/test/screenshots',
        on_failure: true,
        on_error: true,
      },
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          w3c: false,
          args: process.env.CHROME_ARGS.split(' '),
        },
      },
      globals: {
        'abortOnAssertionFailure': true,
        'asyncHookTimeout': 60000,
        'proxyRoot': '/codeengine',
        'account': [ accountId ],
        accountName,
        'waitForConditionTimeout': 20000,
        'waitForConditionPollInterval': 50,
      },
    },
    local: {
      launch_url: 'http://localhost:3000',
      default_path_prefix: '',
    },
    devtest: {
      launch_url: 'https://dev.console.test.cloud.ibm.com',
      default_path_prefix: '',
    },
    devprod: {
      launch_url: 'https://dev.console.cloud.ibm.com',
      default_path_prefix: '',
    },
    'test-ondeck': {
      launch_url: 'https://ondeck.console.test.cloud.ibm.com',
      default_path_prefix: '',
    },
    test: {
      launch_url: 'https://test.cloud.ibm.com',
      default_path_prefix: '',
    },
    'prod-ondeck': {
      launch_url: 'https://ondeck.console.cloud.ibm.com',
      default_path_prefix: '',
    },
    prod: {
      launch_url: 'https://cloud.ibm.com',
      default_path_prefix: '',
    },
  },
};

module.exports = config;
