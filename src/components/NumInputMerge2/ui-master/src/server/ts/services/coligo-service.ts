/**
 * This service provides methods to interact with the MultiTenant ControlPlane API
 */

const COMP_NAME = 'coligo';

import * as resiliency from '@console/console-platform-resiliency';

// TTL in seconds
const PROJECT_INFO_CACHE_TTL = 60 * 60; // one hour

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as projectResourceModel from '../model/project-resource-model';
import * as cacheUtils from '../utils/cache-utils';
import * as coligoUtils from '../utils/coligo-utils';
import * as httpUtils from '../utils/http-utils';
import * as monitorUtils from '../utils/monitoring-utils';

import * as commonModel from '../../../common/model/common-model';
import { IAccessDetails } from '../model/access-details-model';
import * as monitoringModel from '../model/monitoring-model';
import * as commonErrors from './../../../common/Errors';

import * as iamService from './ic-iam-service';

const CACHE_TTL_NAMESPACE_ACCESS_DETAILS = 55 * 60; // 55min

function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken: string, refreshToken?: string): { [key: string]: string } {

  // retrieve a set of common headers from a utils functions
  const headers = Object.assign({}, httpUtils.getCommonHeaders(ctx, accessToken));

  // add coligo service specific headers
  headers['Cache-Control'] = 'max-age=0, no-cache, no-store';
  headers['Content-Type'] = 'application/json';
  if (refreshToken) {
    headers['Refresh-Token'] = refreshToken;
  }

  return headers;
}

/**
 * This helper function checks whether the given project is a multi-tenant enabled project resource. This function resolves to true or false.
 * @param req - the HTTP request object which needs to be passed over to allow object caching
 * @param regionId - the id of the region (e.g. us-south)
 * @param projectGuid - the guid of the project
 */
export function isNamespaceMultitenantEnabled(ctx: commonModel.IUIRequestContext, regionId: string, projectGuid: string): Promise<boolean> {
  if (!projectGuid || !regionId) {
    return Promise.resolve(false);
  }
  return new Promise((resolve, reject) => {
    // retrieve the k8s config for this namespace (aka access details)
    retrieveNamespaceAccessDetails(ctx, regionId, projectGuid).then((accessDetails) => {
      resolve(Boolean(accessDetails && accessDetails.guid));
    }).catch((err) => {
      // at this stage we do not care about the error
      resolve(false);
    });
  });
}

/**
 * This method retrieves the access details for the given namespace.
 * @param {*} ctx - the IUIRequestContext
 * @param {String} regionId - the region identifier (e.g. us-south, us-east, ...)
 * @param {String} cloudResourceGuid - the GUID of the cloud resource
 * @returns {Promise<IAccessDetails>} a promise that resolves to the namespace access details
 */
export async function retrieveNamespaceAccessDetails(ctx: commonModel.IUIRequestContext, regionId: string, cloudResourceGuid: string): Promise<IAccessDetails> {
  const fn = 'retrieveNamespaceAccessDetails ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', cloudResourceGuid: '${cloudResourceGuid}'`);

  const cacheKey = `namespace-access-details_-_${regionId}__${cloudResourceGuid}`;

  // check if cluster access details were created before
  const cachedAccessDetails = cacheUtils.getCacheInstance('users-namespace-access-details').getDecryptedJson(ctx, cacheKey);
  if (cachedAccessDetails) {
    logger.debug(ctx, `${fn}< '${cachedAccessDetails.name}' - from cache`);
    return Promise.resolve(cachedAccessDetails);
  }

  return new Promise((resolve, reject) => {

    // retrieve bx:bx access tokens
    iamService.getBxIAMTokens(ctx)
      .then((bxIamTokens) => (
        // retrieve the namespace config in exchange for bx tokens
        getNamespaceConfig(ctx, regionId, cloudResourceGuid, bxIamTokens.access_token, bxIamTokens.refresh_token)
      ))
      .then((kubeConfig) => {

        // retrieve the access tokens of the cluster
        const namespaceAccessToken: string = getAccessTokenOfNamespace(ctx, kubeConfig);

        // build the endpointURL of the shard
        const serviceEndpointBaseUrl: string = getEndpointUrlOfCluster(ctx, kubeConfig);

        // retrieve the name of the namespace
        const namespaceName: string = getNamespaceNameFromConfig(ctx, kubeConfig);

        // build the return object
        const namespaceAccessDetails: IAccessDetails = {
          accessToken: namespaceAccessToken,
          guid: cloudResourceGuid,
          name: namespaceName,
          region: regionId,
          serviceEndpointBaseUrl,
        };

        // cache the access details
        cacheUtils.getCacheInstance('users-namespace-access-details').putEncryptedJson(ctx, cacheKey, namespaceAccessDetails, CACHE_TTL_NAMESPACE_ACCESS_DETAILS);

        logger.debug(ctx, `${fn}< '${namespaceAccessDetails.name}'`);
        resolve(namespaceAccessDetails);

      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to retrieve details of cloudResourceGuid '${cloudResourceGuid}', regionId: ${regionId}`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetProjectsNamespaceConfigError(cloudResourceGuid, regionId, err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

/**
 * Retrieves the namespace config from the ControlPlane API.
 *
 * @param {String} ctx - the request context
 * @param {String} clusterId - The id of the cluster that should be examined
 * @param {String} namespaceId - The id of the namespace
 * @param {String} accessToken - The users access token
 * @param {String} refreshToken - The users refresh token
 */
export function getNamespaceConfig(ctx: commonModel.IUIRequestContext, clusterId: string, namespaceId: string, accessToken: string, refreshToken: string) {
  const fn = 'getNamespaceConfig ';
  logger.debug(ctx, `${fn}> clusterId: '${clusterId}', namespaceId: '${namespaceId}'`);

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::getNamespaceConfig`,
  };

  return new Promise((resolve, reject) => {

    // retrieve the baseUrl for the given clusterId
    const controlPlaneApiUrl = coligoUtils.getControlPlaneUrl(clusterId);

    // check if the given clusterId resolves to an controlPlane URL
    if (!controlPlaneApiUrl) {
      reject(`clusterId: '${clusterId}' Error: No ControlPlane URL is specified`);
    }

    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessToken, refreshToken),
      maxRetries: 3,
      method: 'GET',
      path: `/api/v1/namespaces/${namespaceId}/config`,
      retryDelay: 1000,
      strictSSL: true,
      timeoutThreshold: 10000,
      urls: controlPlaneApiUrl,
    };

    resiliency.request(options, (error, response, body) => {
      const duration = Date.now() - startTime;

      // check whether the request was successful
      const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

      // log the backend call
      monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

      // create a performance monitoring entry
      monitorUtils.storePerfMonitorEntry(monitor, duration);

      if (isSuccessful) {

        const namespaceConfig = httpUtils.safeJSONParse(ctx, body);
        if (!namespaceConfig) {
          const err = new commonErrors.FailedToGetNamespaceConfigError(namespaceId, new Error('failed to parse response data'));
          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(err)}`);
          return reject(err);
        }

        logger.trace(ctx, `${fn}- namespaceConfig: '${JSON.stringify(namespaceConfig)}'`);
        logger.debug(ctx, `${fn}<`);
        resolve(namespaceConfig);
      } else {
        const errorMessage = `Error getting config of namespace '${namespaceId}' in cluster '${clusterId}' - rc: ${response ? response.statusCode : 'UNKNOWN'}, responseBody: '${body}', error: '${error}'`;
        logger.error(ctx, `${fn}- ${errorMessage}`);

        const err = new commonErrors.FailedToGetNamespaceConfigError(namespaceId, new Error(errorMessage));
        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(err)}`);
        reject(err);
      }
    });
  });
}

/**
 * Retrieves the users access token for the given k8s namespace by parsing the kube config.
 *
 * @param {Object} kubeConfig the k8s configuration
 */
export function getAccessTokenOfNamespace(ctx: commonModel.IUIRequestContext, kubeConfig: any): string {
  const fn = 'getAccessTokenOfNamespace ';
  logger.trace(ctx, `${fn}>`);

  if (kubeConfig === undefined || kubeConfig.users === undefined) {
    logger.trace(ctx, `${fn}< NULL`);
    return null;
  }

  // extract the IAM access token to access the cluster from the given config
  const users = kubeConfig.users;

  logger.trace(ctx, `${fn}- Config contains ${users.length} user objects.`);

  let user;
  // iterate over each user and check for the one that owned the iamTokens
  // tslint:disable-next-line: prefer-for-of
  for (let i = 0; i < users.length; i += 1) {
    if (users[i].name) {
      user = users[i].user;
      logger.trace(ctx, `${fn}- Found the token owner in the config`);
      break;
    }
  }

  if (!user) {
    logger.trace(ctx, `${fn}< NULL - Could find the token owner in the config`);
    return null;
  }

  // extract the auth-provider from the user object
  const authProvider = (user && user['auth-provider']) ? user['auth-provider'] : null;
  if (!authProvider) {
    logger.trace(ctx, `${fn}< NULL - Could find the auth-provider config [//users[]/user/auth-provider]`);
    return null;
  }

  // extract the id-token from the auth-provider
  const idToken: string = authProvider && authProvider.config && authProvider.config['id-token'];

  logger.trace(ctx, `${fn}< token with ${idToken ? idToken.length : 'NULL'} chars`);
  return idToken;
}

/**
 * Retrieves the cluster endpoint URL for the given k8s namespace by parsing the kube config.
 *
 * @param {Object} kubeConfig the kube configuration
 */
export function getEndpointUrlOfCluster(ctx: commonModel.IUIRequestContext, kubeConfig: any): string {
  const fn = 'getEndpointUrlOfCluster ';
  logger.trace(ctx, `${fn}>`);

  if (kubeConfig === undefined || kubeConfig.clusters === undefined || !Array.isArray(kubeConfig.clusters)) {
    logger.trace(ctx, `${fn}< NULL`);
    return null;
  }

  // extract the endpoint URL of the cluster from the given config
  const clusters = kubeConfig.clusters;

  logger.trace(ctx, `${fn}- Config contains ${clusters.length} clusters.`);

  if (clusters.length < 1 || !clusters[0] || !clusters[0].cluster || !clusters[0].cluster.server) {
    logger.trace(ctx, `${fn}< NULL - Could find the cluster endpoint url`);
    return null;
  }

  const endpointUrl: string = clusters[0].cluster.server;

  logger.trace(ctx, `${fn}< endpointURL '${endpointUrl}'`);
  return endpointUrl;
}

/**
 * Retrieves the namespace name the given k8s namespace by parsing the kube config.
 *
 * @param {Object} kubeConfig the kube configuration
 */
function getNamespaceNameFromConfig(ctx: commonModel.IUIRequestContext, kubeConfig: any): string {
  const fn = 'getNamespaceNameFromConfig ';
  logger.trace(ctx, `${fn}>`);

  if (kubeConfig === undefined || kubeConfig.contexts === undefined || !Array.isArray(kubeConfig.contexts)) {
    logger.trace(ctx, `${fn}< NULL`);
    return null;
  }

  // extract the endpoint URL of the cluster from the given config
  const contexts = kubeConfig.contexts;

  logger.trace(ctx, `${fn}- Config contains ${contexts.length} contexts.`);

  if (contexts.length < 1 || !contexts[0] || !contexts[0].context || !contexts[0].context.namespace) {
    logger.trace(ctx, `${fn}< NULL - Could find the contexts namespace name`);
    return null;
  }

  const namespaceName: string = contexts[0].context.namespace;

  logger.trace(ctx, `${fn}< namespaceName '${namespaceName}'`);
  return namespaceName;
}

/**
 * This method retrieves the status of the tenant
 * @param {*} ctx - the IUIRequestContext
 * @param {String} clusterId - the region identifier (e.g. us-south, us-east, ...)
 * @param {String} cloudResourceGuid - the GUID of the cloud resource
 * @returns {Promise<IAccessDetails>} a promise that resolves to the namespace access details
 */
export async function getTenantStatus(ctx: commonModel.IUIRequestContext, clusterId: string, cloudResourceGuid: string): Promise<projectResourceModel.ITenantStatus> {
  const fn = 'getTenantStatus ';

  logger.debug(ctx, `${fn}> clusterId: '${clusterId}', cloudResourceGuid: '${cloudResourceGuid}'`);

  return new Promise((resolve, reject) => {

    const cachedStatus = getTenantStatusFromCache(ctx, cloudResourceGuid);
    if (cachedStatus) {
      logger.debug(ctx, `${fn}< from cache`);
      return resolve(cachedStatus);
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
      kind: 'backend',
      name: `${COMP_NAME}::getTenantStatus`,
    };

    // retrieve the baseUrl for the given clusterId
    const controlPlaneApiUrl = coligoUtils.getControlPlaneUrl(clusterId);

    // check if the given clusterId resolves to an controlPlane URL
    if (!controlPlaneApiUrl) {
      reject(`clusterId: '${clusterId}' Error: No ControlPlane URL is specified`);
    }

    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, iamService.getIAMAccessToken(ctx)),
      json: true,
      method: 'GET',
      path: `/api/v1/tenant/${cloudResourceGuid}/status`,
      strictSSL: true,
      urls: controlPlaneApiUrl,
    };

    resiliency.request(options, (error, response, body) => {
      const duration = Date.now() - startTime;

      // check whether the request was successful
      const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

      // log the backend call
      monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

      // create a performance monitoring entry
      monitorUtils.storePerfMonitorEntry(monitor, duration);

      if (isSuccessful) {

        const tenantStatus: projectResourceModel.ITenantStatus = httpUtils.safeJSONParse(ctx, body);
        if (!tenantStatus) {
          const err = new commonErrors.FailedToGetTenantStatusError(cloudResourceGuid, new Error('failed to parse response data'));
          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(err)}`);
          return reject(err);
        }

        logger.trace(ctx, `${fn}- tenantStatus: ${JSON.stringify(tenantStatus)}`);
        if (tenantStatus.Domainstatus === 'Ready') {
          storeTenantStatusInCache(ctx, cloudResourceGuid, tenantStatus);
          logger.debug(ctx, `${fn}- stored status of tenant '${cloudResourceGuid}' in cache`);
        }

        logger.debug(ctx, `${fn}<`);
        resolve(tenantStatus);
      } else {
        const errorMessage = `Error getting status of tenant '${cloudResourceGuid}' in cluster '${clusterId}' - rc: ${response ? response.statusCode : 'UNKNOWN'}, responseBody: '${body}', error: '${error}'`;
        logger.error(ctx, `${fn}- ${errorMessage}`);

        const err = new commonErrors.FailedToGetTenantStatusError(cloudResourceGuid, new Error(errorMessage));
        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(err)}`);
        reject(err);
      }
    });
  });
}

function getTenantStatusFromCache(ctx: commonModel.IUIRequestContext, tenantId: string): projectResourceModel.ITenantStatus {
  try {
    return cacheUtils.getCacheInstance('project-info', PROJECT_INFO_CACHE_TTL).get(ctx, `status__${tenantId}`);
  } catch (e) {
    logger.error(ctx, `Failed to retrieve status of tenant '${tenantId}' from in-memory cache`, e);
  }
}

function storeTenantStatusInCache(ctx: commonModel.IUIRequestContext, tenantId: string, tenantStatus: projectResourceModel.ITenantStatus) {
  cacheUtils.getCacheInstance('project-info', PROJECT_INFO_CACHE_TTL).put(ctx, `status__${tenantId}`, tenantStatus);
}

/**
 * This method retrieves the information of the project (Domainstatus, ExpireTimestamp, ...)
 * @param {*} ctx - the IUIRequestContext
 * @param {String} clusterId - the region identifier (e.g. us-south, us-east, ...)
 * @param {String} cloudResourceGuid - the GUID of the cloud resource
 * @returns {Promise<IAccessDetails>} a promise that resolves to the namespace access details
 */
export async function getProjectInfo(ctx: commonModel.IUIRequestContext, clusterId: string, cloudResourceGuid: string): Promise<projectResourceModel.IProjectInfo> {
  const fn = 'getProjectInfo ';

  logger.debug(ctx, `${fn}> clusterId: '${clusterId}', cloudResourceGuid: '${cloudResourceGuid}'`);

  return new Promise((resolve, reject) => {

    const cachedStatus = getProjectInfoFromCache(ctx, cloudResourceGuid);
    if (cachedStatus) {
      logger.debug(ctx, `${fn}< from cache`);
      return resolve(cachedStatus);
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
      kind: 'backend',
      name: `${COMP_NAME}::getProjectInfo`,
    };

    // retrieve the baseUrl for the given clusterId
    const controlPlaneApiUrl = coligoUtils.getControlPlaneUrl(clusterId);

    // check if the given clusterId resolves to an controlPlane URL
    if (!controlPlaneApiUrl) {
      reject(`clusterId: '${clusterId}' Error: No ControlPlane URL is specified`);
    }

    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, iamService.getIAMAccessToken(ctx)),
      json: true,
      method: 'GET',
      path: `/api/v1/project/${cloudResourceGuid}/info`,
      strictSSL: true,
      urls: controlPlaneApiUrl,
    };

    resiliency.request(options, (error, response, body) => {
      const duration = Date.now() - startTime;

      // check whether the request was successful
      const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

      // log the backend call
      monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

      // create a performance monitoring entry
      monitorUtils.storePerfMonitorEntry(monitor, duration);

      if (isSuccessful) {

        const projectInfo: projectResourceModel.IProjectInfo = httpUtils.safeJSONParse(ctx, body);

        if (!projectInfo) {
          const err = new commonErrors.FailedToGetProjectInfoError(cloudResourceGuid, new Error('failed to parse response data'));
          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(err)}`);
          return reject(err);
        }

        logger.trace(ctx, `${fn}- projectInfo: ${JSON.stringify(projectInfo)}`);
        if (projectInfo.Domainstatus === 'Ready') {
          storeProjectInfoInCache(ctx, cloudResourceGuid, projectInfo);
          logger.debug(ctx, `${fn}- stored information of project '${cloudResourceGuid}' in cache`);
        }

        logger.debug(ctx, `${fn}<`);
        resolve(projectInfo);
      } else {
        const errorMessage = `Error getting information of project '${cloudResourceGuid}' in cluster '${clusterId}' - rc: ${response ? response.statusCode : 'UNKNOWN'}, responseBody: '${body}', error: '${error}'`;
        logger.error(ctx, `${fn}- ${errorMessage}`);

        const err = new commonErrors.FailedToGetProjectInfoError(cloudResourceGuid, new Error(errorMessage));
        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(err)}`);
        reject(err);
      }
    });
  });
}

function getProjectInfoFromCache(ctx: commonModel.IUIRequestContext, projectId: string): projectResourceModel.IProjectInfo {
  try {
    return cacheUtils.getCacheInstance('project-info').get(ctx, projectId);
  } catch (e) {
    logger.error(ctx, `Failed to retrieve information of project '${projectId}' from in-memory cache`, e);
  }
}

function storeProjectInfoInCache(ctx: commonModel.IUIRequestContext, projectId: string, projectInfo: projectResourceModel.IProjectInfo) {
  cacheUtils.getCacheInstance('project-info').put(ctx, projectId, projectInfo);
}
