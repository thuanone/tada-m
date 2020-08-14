import $ from 'jquery';
import mockjax from 'jquery-mockjax';

window.$ = window.jQuery = global.$ = global.jQuery = $;

mockjax($, window);

// Stub global window properties for tests
const config = {
  proxyRoot: '/codeengine/',
  docs: {
    containers_docs_link: '/docs/containers?topic=containers-getting-started',
  },
};
const staticFileMap = {
  'img/helm-chart-default-icon': { path: '/path/to/helm-chart-default-icon.png' },
  'img/artboard-1': { path: '/path/to/artboard-1.svg' },
  'img/artboard-2': { path: '/path/to/artboard-2.svg' },
  'img/artboard-3': { path: '/path/to/artboard-3.svg' },
  'img/artboard-4': { path: '/path/to/artboard-4.svg' },
  'img/registry-icons-01': { path: '/path/to/registry-icons-01.svg' },
  'img/registry-icons-02': { path: '/path/to/registry-icons-02.svg' },
  'img/registry-icons-03': { path: '/path/to/registry-icons-03.svg' },
};
window.armada = {
  nodeEnv: 'production',
  isAuthenticated: true,
  userEmail: 'test@us.ibm.com',
  config,
  flags: {
    'coligo-ui-feature-projectexpiration': true,
  },
  os: 'linux',
  unitTests: true,
  staticFileMap,
  consoleEnv: 'stage',
  lng: '',
};
window.storage = {
  ready: callback => callback(),
  getItem: () => {},
  setItem: () => {},
  removeItem: () => {},
  getStorage: () => {},
  getStorageKey: key => `full-${key}`,
};
const contextData = {
  region: { id: 'region-1', name: 'us-south' },
  account: { type: 'trial', accountGuid: 'account-1', billingCountryCode: 'USA' },
  selectedAccountGuid: 'account-1',
};
const promise = { then: cb => cb() };
window.header = {
  whenAccountReady: callback => callback(contextData),
  whenOrgReady: callback => callback(contextData),
  whenIAMRefreshComplete: callback => callback(),
  getCookie: () => 'foo',
  fetchOrgAndSpace: () => promise,
  fetchResourceGroups: () => ({ then: cb => cb({ resourceGroups: [{ id: 'group1', name: 'Group 1' }] }) }),
  loadEstimatorJS: () => true,
};
window.bluemixAnalytics = {
  trackEvent: () => {},
  pageEvent: () => {},
};
window.scrollTo = () => {};

// Set up mockjax defaults
$.mockjaxSettings.responseTime = 0;
$.mockjaxSettings.logging = false;

const originalEnv = JSON.stringify(window.armada);
document.title = 'IBM Cloud';
afterEach(() => {
  const env = JSON.parse(originalEnv);
  Object.assign(window.armada, env);
  Object.assign(window.armada.config, env.config);
  document.title = 'IBM Cloud';
});

// Configure enzyme
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

// Include all source files so they are included in the coverage report
// const context = require.context('./client', true, /\.jsx?$/);
// context.keys().forEach(context);
