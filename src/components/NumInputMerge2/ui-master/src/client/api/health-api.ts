import utils from './utils';

const env = window.armada;
const config = env.config;

export function doGetColigoContext(clgId, always?) {
  return new Promise((resolve, reject) => {
    utils.doGet({
      url: `${config.proxyRoot}api/health/v1/context/${clgId}`,
    }).done(resolve).fail((xhr) => { reject(utils.transformErrorResponse(xhr)); }).always(always);
  });
}

export function doGetPluginVersion(always?) {
  return new Promise((resolve, reject) => {
    utils.doGet({
      url: '/healthcheck/v1/releases'
    }).done(resolve).fail((xhr) => { reject(utils.transformErrorResponse(xhr)); }).always(always);
  });
}
