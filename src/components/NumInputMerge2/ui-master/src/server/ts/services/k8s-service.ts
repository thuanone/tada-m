
const COMP_NAME = 'k8s';

import * as resiliency from '@console/console-platform-resiliency';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import * as kubemodel from '../model/k8s-model';
import * as monitoringModel from '../model/monitoring-model';
import * as httpUtils from './../utils/http-utils';
import * as monitorUtils from './../utils/monitoring-utils';

export function transformNamespacesResponse(namespace) {
  const fn = 'transformNamespacesResponse ';
  logger.trace(`${fn}> namespace: '${JSON.stringify(namespace)}'`);

  if (!namespace || !namespace.metadata) {
    return null;
  }
  // for now we just map the whole namespace object
  const ns = namespace;

  logger.trace(`${fn}< '${JSON.stringify(ns)}'`);
  return ns;
}

function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken: string) {
  return Object.assign({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'cache-control': 'max-age=0, no-cache, no-store',
  }, httpUtils.getCommonHeaders(ctx, accessToken));
}

/**
 * Retrieves all namespaces of the given cluster. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 */
export function getKubernetesNamespacesOfCluster(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails) {
  const fn = 'getKubernetesNamespacesOfCluster ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  if (!accessDetails.serviceEndpointBaseUrl || !accessDetails.accessToken) {
    const errorMsg = 'serviceEndpointBaseUrl and accessToken must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::getKubernetesNamespacesOfCluster`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: '/api/v1/namespaces?limit=500',
      strictSSL: true,
      urls: accessDetails.serviceEndpointBaseUrl,
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
        const namespacesList = JSON.parse(body);

        logger.trace(ctx, `${fn}- namespacesList: ${JSON.stringify(namespacesList)}`);

        // check whether namespaces list is of kind 'NamespaceList'
        if (namespacesList && namespacesList.kind === 'NamespaceList' && Array.isArray(namespacesList.items)) {

          const namespaces = namespacesList.items.map(transformNamespacesResponse);

          logger.debug(ctx, `${fn}< Retrieved ${namespaces.length} namespaces`);
          resolve(namespaces);
        } else {
          logger.debug(ctx, `${fn}< EMPTY list`);
          resolve([]);
        }

      } else {
        // get an enhanced error object
        error = httpUtils.getEnhancedErrorObj(error, response);

        logger.error(ctx, `Error getting Kubernetes namespaces clusters of cluster - URL: ${accessDetails.serviceEndpointBaseUrl}/api/v1/namespaces/`, error);
        logger.debug(ctx, `${fn}< ERROR`);
        reject(error);
      }
    });
  });
}

/**
 * Retrieves a namespace of the given cluster. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 */
export function getKubernetesNamespaceOfCluster(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<any> {
  const fn = 'getKubernetesNamespaceOfCluster ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  if (!accessDetails.name) {
    const errorMsg = 'namespaceNameOrId, serviceEndpointBaseUrl and accessToken must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::getKubernetesNamespaceOfCluster`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: `/api/v1/namespaces/${accessDetails.name}`,
      strictSSL: true,
      urls: accessDetails.serviceEndpointBaseUrl,
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
        try {
          const knNamespace = JSON.parse(body);

          logger.info(ctx, `${fn}- namespace: ${JSON.stringify(knNamespace)}`);
          logger.debug(ctx, `${fn}< Retrieved: ${knNamespace && knNamespace.metadata ? knNamespace.metadata.name : 'Unknown namespace object'}`);
          resolve(knNamespace);
        } catch (e) {
          logger.error(ctx, `failed to convert response.body to JSON - URL: ${options.urls}${options.path} - Status: ${response && response.statusCode}`, error);
          logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
          reject(e);
        }

      } else {
        // get an enhanced error object
        error = httpUtils.getEnhancedErrorObj(error, response);

        logger.error(ctx, `Error getting Kubernetes namespace '${accessDetails.name}' of cluster - URL: ${accessDetails.serviceEndpointBaseUrl}/api/v1/namespaces/${accessDetails.name}`, error);
        logger.debug(ctx, `${fn}< ERROR`);
        reject(error);
      }
    });
  });
}

/**
 * Retrieves all pods of the given namespace.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKubernetesPodsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, labelSelector?: string): Promise<kubemodel.IKubernetesPod[]> {
  const fn = 'getKubernetesPodsOfNamespace ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', labelSelector: '${labelSelector}'`);

  if (!accessDetails.name) {
    const errorMsg = 'namespaceNameOrId, serviceEndpointBaseUrl and accessToken must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  let urlParams = '?limit=500';
  if (labelSelector) {
    urlParams += '&labelSelector=' + encodeURIComponent(labelSelector);
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::getKubernetesPodsOfNamespace`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: `/api/v1/namespaces/${accessDetails.name}/pods${urlParams}`,
      strictSSL: true,
      urls: accessDetails.serviceEndpointBaseUrl,
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
        try {
          const knPods: kubemodel.IKubernetesPod[] = JSON.parse(body).items;
          logger.debug(ctx, `${fn}< Retrieved: ${knPods && knPods.length ? knPods.length : 'Unknown list of pods, or empty list'}`);
          resolve(knPods);
        } catch (e) {
          logger.error(ctx, `failed to convert response.body to JSON - URL: ${options.urls}${options.path} - Status: ${response && response.statusCode}`, error);
          logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
        }

      } else {
        // get an enhanced error object
        error = httpUtils.getEnhancedErrorObj(error, response);

        logger.error(ctx, `Error getting Kubernetes namespace '${accessDetails.name}' of cluster - URL: ${accessDetails.serviceEndpointBaseUrl}/api/v1/namespaces/${accessDetails.name}/pods`, error);
        logger.debug(ctx, `${fn}< ERROR`);
        reject(error);
      }
    });
  });
}

/**
 * This is a SelfSubjectAccessReview request to check whether the given user is allowed to perform the action (see: verb) on a specific resource within the given namespace.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} verb - the action (e.g. 'list', 'get', ...)
 * @param {String} resource - the resource (e.g. 'namespaces', ...)
 */
export function isUserAllowedTo(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, verb, resource) {
  const fn = 'isUserAllowedTo ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', verb: '${verb}', resource: '${resource}'`);

  if (!accessDetails.name || !verb || !resource) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace, verb and resource must be set properly';
    logger.trace(ctx, `${fn}< false - '${errorMsg}'`);
    return Promise.resolve({ allowed: false, reason: errorMsg });
  }

  // POST: https://c2.us-south.containers.cloud.ibm.com:31952/apis/authorization.k8s.io/v1/selfsubjectaccessreviews
  // req body: {"kind":"SelfSubjectAccessReview","apiVersion":"authorization.k8s.io/v1","metadata":{"creationTimestamp":null},"spec":{"resourceAttributes":{"namespace":"default","verb":"list","resource":"namespaces"}},"status":{"allowed":false}}
  // reponse: {"kind":"SelfSubjectAccessReview","apiVersion":"authorization.k8s.io/v1","metadata":{"creationTimestamp":null},"spec":{"resourceAttributes":{"namespace":"default","verb":"list","resource":"namespaces"}},"status":{"allowed":true,"reason":"RBAC: allowed by ClusterRoleBinding \"ibm-admin\" of ClusterRole \"cluster-admin\" to User \"IAM#reggeenr@de.ibm.com\""}}

  const payloadString = `{"kind":"SelfSubjectAccessReview","apiVersion":"authorization.k8s.io/v1","metadata":{"creationTimestamp":null},"spec":{"resourceAttributes":{"namespace":"${accessDetails.name}","verb":"${verb}","resource":"${resource}"}},"status":{"allowed":false}}`;
  const payload = JSON.parse(payloadString);

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::isUserAllowedTo`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: payload,
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'POST',
      path: '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      strictSSL: true,
      urls: accessDetails.serviceEndpointBaseUrl,
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

        try {
          const authorizationResponse = JSON.parse(JSON.stringify(body));
          logger.trace(ctx, `${fn}- authorizationResponse: ${JSON.stringify(authorizationResponse)}`);

          // check whether response is of kind 'SelfSubjectAccessReview'
          if (authorizationResponse && authorizationResponse.kind === 'SelfSubjectAccessReview' && authorizationResponse.status) {

            logger.debug(ctx, `${fn}< ${authorizationResponse.status.allowed}`);
            resolve(authorizationResponse.status);
            return;
          }
        } catch (e) {
          error = { status: e.message };
        }
      }

      // get an enhanced error object
      error = httpUtils.getEnhancedErrorObj(error, response);

      const status = {
        allowed: false,
        reason: error.status || 'UNKNOWN',
      };

      logger.error(ctx, `Error while performing 'SelfSubjectAccessReview': 'can-i ${verb} ${resource} -n ${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`, error);
      logger.debug(ctx, `${fn}< false - ${status.reason}`);
      resolve(status);
    });
  });

}
