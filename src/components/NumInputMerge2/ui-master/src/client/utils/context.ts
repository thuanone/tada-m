import nav from './nav';
import win from './window';

let filterRegion;
let filterResourceGroup;

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    header: any;
  }
}

const regionToMetro = {
  'au-syd': 'syd',
  'eu-de': 'fra',
  'eu-gb': 'lon',
  'jp-tok': 'tok',
  'us-east': 'wdc',
  'us-south': 'dal',
};

const isStage = () => window.armada.consoleEnv !== 'prod';
const isRegistry = () => /^\/[^\/]+\/registry\//.test(win.get('location.pathname'));
const supportsAllLocations = () => !isRegistry();

const configPath = () => {
  if (isStage()) {
    return 'containers-kubernetes/stage';
  }
  if (isRegistry()) {
    return 'containers-kubernetes/registry';
  }
  return 'containers-kubernetes/clusters';
};

const getDefaultRegion = () => 'us-south';
const getRegion = () => nav.getParam('region') || filterRegion || (supportsAllLocations() ? '' : getDefaultRegion());
const setRegion = (region: string) => (filterRegion = region);
const getMetro = (region?: string) => regionToMetro[region || getRegion().split(':').pop()] || '';
const getResourceGroup = () => nav.getParam('resourceGroup') || filterResourceGroup || '';
const setResourceGroup = (resourceGroup) => (filterResourceGroup = resourceGroup);
const getAccountData = (callback) => {
  if (window.armada.isAuthenticated) {
    window.header.whenAccountReady(callback);
  } else {
    callback();
  }
};
const getAccountId = (callback) => {
  getAccountData((data) => {
    callback(data && (data.selectedAccountGuid || (data.account && data.account.accountGuid)));
  });
};

const isAuthenticated = () => {
  return window.armada.isAuthenticated;
};

export default {
  configPath,
  getAccountData,
  getAccountId,
  getDefaultRegion,
  getMetro,
  getRegion,
  getResourceGroup,
  isAuthenticated,
  isRegistry,
  setRegion,
  setResourceGroup,
  supportsAllLocations,
};
