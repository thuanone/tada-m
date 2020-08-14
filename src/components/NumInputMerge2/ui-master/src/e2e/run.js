require('events').EventEmitter.defaultMaxListeners = 200;
const utils = require('./utils');
const assert = require('assert');
const seconds = 1000;
const minutes = 60 * seconds;
let cookies = [];

const fullTestRun = {
  before: (client, done) => {
    // When running in the console deployment pipeline the console URL is provided as an env var
    if (process.env.CONSOLE_URL) client.launch_url = process.env.CONSOLE_URL;
    done();
  },

  beforeEach: (client, done) => {
    client.init(client.launch_url);
    if (cookies.length > 0 && client.currentTest.name !== 'Console login') {
      client.setCookies(cookies)
        .url(`${client.launch_url}${client.globals.proxyRoot}`)
        .waitForElementVisible('.coligo-ui', 1 * minutes)
        .perform(() => done());
    } else client.url(`${client.launch_url}${client.globals.proxyRoot}`).perform(() => done());
  },

  after: (client, done) => {
    client.end(() => done());
  },

  'Console login': client => {
    client
      .setGDPRCookies()
      .url(client.launch_url)
      .login()
      .perform(() => {cookies = client.getCookies()});
  },

  'Set context': client => {
    // const context = [];
    const account = process.env.E2E_TEST_ACCOUNT || client.globals.account;
    const accountName = process.env.E2E_TEST_ACCOUNT_NAME || client.globals.accountName;
    client
      // set account
      //.setAccount(account);
      .setAccountByName(accountName);
  },

/*  'Go to Code Engine world': client => {
    client
      .waitForElementVisible('.hero.overview-hero', 6000);
      // TODO: Go directly to the URL until the nav item points to our new root
      //.click('.bx--left-nav__trigger')
      .pause(1000)
      .waitForElementVisible('#containers-menu', 10000)
      .click('#containers-menu')
      // .url(`${client.launch_url}${client.globals.proxyRoot}/clusters`)
      .waitForElementVisible('.armada-table-wrapper, .armada-overview, .armada-empty-page', 60000)
      .ifElementExists('#location-filter .filter-reset', () => client
        .click('#location-filter .filter-reset')
        .pause(1000))
      .waitForElementVisible('.armada-table-wrapper', 60000)
      // Verify that the user email address is not obfuscated. There is a cloudflare configuration that
      // was obfuscating the email and breaking account selection. This check will make sure we don't
      // regress. Unfortunately it's inside a "hidden" element and the nightwatch convenience functions
      // don't seem to find it, so we grab it directly from the browser.
      .waitForElementPresent('#profile-dropdown .user-email', 30000)
      .execute('return document.querySelector("#profile-dropdown .user-email").innerHTML', [], result => assert.equal(result.value, username));
  },*/
};

const testRun = process.env.E2E_BASIC_TEST === 'true' ? require(`${__dirname}/specs/e2e/basic`) : fullTestRun;

if (testRun === fullTestRun) {
  // Import all the tests from individual files under the `specs` folder. Each file must
  // have a single export that is a test spec object. This spec will get added to the
  // testRun test suite.
  const tests = [];
  let filteredTests = null;
  if (process.env.INT_TEST_FILTER) {
    filteredTests = process.env.INT_TEST_FILTER.split(',').map(n => n.trim());
  }
  if (filteredTests && filteredTests.length > 0) {
    filteredTests.forEach(ft => {
      // eslint-disable-next-line global-require

      console.log('Adding filtered test file: ' + ft);
      tests.push(require(`${__dirname}/specs/${ft}`));
    });
  } else {
    utils.getTests('/specs/', 'pageObjectTests.js', tests);
  }

  tests.forEach(t => Object.assign(testRun, t));
}

module.exports = testRun;
