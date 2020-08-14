import utils from './utils';

const config = window.armada.config;

const getFlag = (flag, callback, errback?, always?) => {

  // first check if the armada config provides the given flag
  if (window.armada && window.armada.flags && typeof window.armada.flags[flag] !== 'undefined') {
    return callback({ value: window.armada.flags[flag] });
  }

  const getResult = utils.doGet({
    url: `${config.proxyRoot}api/flags?flag=${flag}`,
  });
  getResult.done(callback);

  if (errback) {
    getResult.fail(errback);
  }
  if (always) {
    getResult.always(always);
  }

  return getResult;
};

const flags: { [key: string]: string } = {
  FEATURE_ENVVAR_V2: 'coligo-ui-feature-env-v2',
  FEATURE_CLIENTERRORS: 'coligo-ui-feature-clienterrors',
  FEATURE_CLIENTLOGS: 'coligo-ui-feature-clientlogs',
  FEATURE_CONTAINER_REGISTRIES: 'coligo-ui-feature-icr',
  FEATURE_SOURCE_TO_IMAGE: 'coligo-ui-feature-s2i',
  FEATURE_SECRETS: 'coligo-ui-feature-secrets',
  FEATURE_PROJECT_EXPIRATION: 'coligo-ui-feature-projectexpiration',
  FEATURE_LIFTED_LIMITATIONS: 'coligo-ui-feature-liftedlimitations',
  OFFERING_ANNOUNCEMENT: 'coligo-ui-offering-announcement',
  UI_DEVOPS: 'coligo-ui-devops',
  ALPHA_FEATURES: 'coligo-ui-features-alpha',
};

export default { flags, getFlag };
