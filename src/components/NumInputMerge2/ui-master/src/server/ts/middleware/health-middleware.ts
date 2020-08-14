import * as aceUtils from '@console/console-platform-bluemix-utils';
import * as resiliency from '@console/console-platform-resiliency';

import * as commonModel from '../../../common/model/common-model';
import * as coligoUtils from '../utils/coligo-utils';

const COMPONENT = 'health';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:middleware:${COMPONENT}`);

export function getAceSessionStoreStatus(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  return new Promise<commonModel.IUIServiceStatus>((resolve, reject) => {
      const serviceStatus: commonModel.IUIServiceStatus = {
          id: 'ace-cache',
          status: 'ERROR',
      };
      ctx.session.save((err) => {

          serviceStatus.status = err ? 'FAILED' : 'OK';
          if (err) {
              logger.error(ctx, `Session check failed: ${JSON.stringify(err)}`);
          }
          resolve(serviceStatus);
      });
  });
}

export function getAceHeaderFilesStatus(req, ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  return new Promise((resolve, reject) => {
      const serviceStatus: commonModel.IUIServiceStatus = {
          id: 'ace-header',
          status: 'ERROR',
      };

      // Check on if we can access the ACE global header
      const aceProxyUrl = aceUtils.getAceProxyUrl(req, true);
      logger.debug(ctx, `getAceHeaderFilesStatus - Trying to fetch ACE global styles and javascript: ${aceProxyUrl}/api/v6/files`);
      try {
          resiliency.request({
              cachePolicy: 'NO_CACHE',
              method: 'GET',
              path: '/api/v6/files',
              urls: aceProxyUrl,
          }, (err, resp, body) => {
              serviceStatus.status = (err || resp.statusCode >= 400) ? 'FAILED' : 'OK';
              if (err) {
                  logger.error(ctx, `ACE common files check failed: ${JSON.stringify(err)}`);
              } else if (resp.statusCode >= 400) {
                  logger.error(ctx, `ACE common files check failed (${resp.statusCode}): ${JSON.stringify(body)}`);
              }
              resolve(serviceStatus);
          });
      } catch (e) {
          logger.error(ctx, `Error in request to ACE common files (js and css), Err: ${JSON.stringify(e)}`);
          resolve(serviceStatus);
      }
  });
}

export function getColigoApiServerStatus(ctx: commonModel.IUIRequestContext, regionId: string): Promise<commonModel.IUIServiceStatus> {
  const fn = 'getColigoApiServerStatus ';
  return new Promise((resolve, reject) => {
      const serviceStatus: commonModel.IUIServiceStatus = {
          id: `coligo-api-${regionId}`,
          status: 'ERROR',
      };

      // Check if we can access the Coligo API Server endpoint
      const apiServerUrl = coligoUtils.getControlPlaneUrl(regionId);
      logger.debug(ctx, `${fn} - Checking whether API server can be reached`);
      try {
          resiliency.request({
              cachePolicy: 'NO_CACHE',
              method: 'GET',
              path: '/',
              strictSSL: false, // due to a broken certificate in eu-de we need to fallback to strictSSL=false
              urls: apiServerUrl,
          }, (err, resp, body) => {
              serviceStatus.status = (err || resp.statusCode >= 400) ? 'FAILED' : 'OK';
              if (err) {
                  logger.error(ctx, `Coligo API server check failed: ${JSON.stringify(err)}, region: ${regionId}, apiServerUrl: '${apiServerUrl}'`);
              } else if (resp.statusCode >= 400) {
                  logger.error(ctx, `Coligo API server check failed (${resp.statusCode}): ${JSON.stringify(body)}, region: ${regionId}, apiServerUrl: '${apiServerUrl}'`);
              }
              resolve(serviceStatus);
          });
      } catch (e) {
          logger.error(ctx, `Error in request to Coligo API server, region: ${regionId}, apiServerUrl: '${apiServerUrl}', Err: ${JSON.stringify(e)}`);
          resolve(serviceStatus);
      }
  });
}

export function getAppConfigStatus(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  const fn = 'getAppConfigStatus ';
  return new Promise((resolve, reject) => {
      const configStatus: commonModel.IUIServiceStatus = {
          id: 'configuration',
          status: 'OK',
      };

      const mandatoryConfigProperties = ['coligoEnvironments', 'coligoResourcePlanId', 'coligoResourceId', 'iamGlobalUrl', 'resourceControllerUrl', 'sessionCacheName', 'resiliencyCacheName', 'iamClientId', 'iamClientSecret', 'LAUNCH_DARKLY_SDK_KEY', 'sessionKey', 'sessionSecret', 'aceAnalyticsRoute', 'aceCommonRoute', 'sessionSecretApiKey'];
      if (process.env.NODE_ENV !== 'development') {
          mandatoryConfigProperties.push('SEGMENT_KEY');
      }

      for (const configProp of mandatoryConfigProperties) {
          if (!process.env[configProp]) {
              configStatus.status = 'FAILED';
              configStatus.details = `Property '${configProp}' is not set`;
              logger.warn(ctx, `${fn} - Property '${configProp}' is not set`);
              break;
          }
      }

      resolve(configStatus);
  });
}
