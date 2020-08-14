import * as resiliency from '@console/console-platform-resiliency';

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import { IKubernetesQueryParameters, IKubernetesResourceList, IKubernetesStatus } from '../model/k8s-model';
import * as monitoringModel from '../model/monitoring-model';
import * as httpUtils from '../utils/http-utils';
import * as monitorUtils from '../utils/monitoring-utils';

export function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken: string, contentType?: string) {
  return Object.assign({
    'Accept': 'application/json',
    'Content-Type': contentType || 'application/json',
    'cache-control': 'max-age=0, no-cache, no-store',
  }, httpUtils.getCommonHeaders(ctx, accessToken));
}

/**
 * Get the creation timestamp of a resource from it's metadata field
 * @param resource  A kube resource
 */
export function getResourceTimestamp(resource) {
  let result = (resource.metadata && resource.metadata.creationTimestamp) ? Date.parse(resource.metadata.creationTimestamp) : -1;
  if (isNaN(result)) {
    // could not parse date -> treat as if no date was set in the first place
    result = -1;
  }

  return result;
}

function compareResourceByCreationTimestamp(a, b) {
  const timeA = getResourceTimestamp(a);
  const timeB = getResourceTimestamp(b);

  return timeB - timeA;
}

/**
 * Retrieves a kubernetes resource of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {Log4jsLogger} logger - the logger to use
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} componentName - the component that issued the call
 * @param {String} uri - the URI to access the resource
 * @param {String} resourceKind - the kind of the resource
 * @param {String} resourceName - the name of the build
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. '.knative.dev/service=hello-world')
 */
export function getKubeResource(logger, ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, componentName: string, uri: string, resourceKind: string, resourceName: string, labelSelector?): any {
  const fn = 'getKubeResource ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', componentName: '${componentName}', resourceKind: '${resourceKind}', resourceName: '${resourceName}', labelSelector: '${labelSelector}'`);

  // input check
  if (!accessDetails.name || !resourceName) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace, resourceName must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  let urlParams = '';
  if (labelSelector) {
    urlParams += '?labelSelector=' + encodeURIComponent(labelSelector);
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${componentName}::get-${resourceKind}`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: `${uri}${urlParams}`,
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

        const rawResourceObj = httpUtils.safeJSONParse(ctx, body);

        logger.trace(ctx, `${fn}- ${resourceKind} resource: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          const resourceObj = rawResourceObj;

          logger.debug(ctx, `${fn}< ${rawResourceObj.kind}: ${(resourceObj.metadata && resourceObj.metadata.name) ? resourceObj.metadata.name : 'NAME_NOT_SET'}`);
          resolve(resourceObj);
        } else {
          logger.debug(ctx, `${fn}< ERROR`);
          return reject(new Error(`Could not retrieve the ${resourceKind} of '${resourceName}' within namespace '${accessDetails.name}'`));
        }

      } else {
        // set the HTTP status code into the error
        error = httpUtils.getEnhancedErrorObj(error, response);

        logger.error(ctx, `Error getting ${resourceKind} of '${resourceName}' within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - responseBody: '${body && JSON.stringify(body)}'`, error);
        logger.debug(ctx, `${fn}< ERROR  - ${JSON.stringify(error)}`);
        reject(new Error(error));
      }
    });
  });
}

/**
 * Retrieves all kube resources of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {Log4jsLogger} logger - the logger to use
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} componentName - the component that issued the call
 * @param {String} uri - the URI to access the resource
 * @param {String} resourceKind - the kind of the resource
 * @param {String} queryParameters - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKubeResourceList(logger, ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, componentName: string, uri: string, resourceKind: string, queryParameters?: IKubernetesQueryParameters): Promise<IKubernetesResourceList> {
  const fn = 'getKubeResourceList ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', componentName: '${componentName}', resourceKind: '${resourceKind}', queryParameters: '${queryParameters && JSON.stringify(queryParameters)}'`);

  // input check
  if (!accessDetails.name) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const limit = (queryParameters && queryParameters.limit) ? queryParameters.limit : 500;

  let urlParams = `?limit=${limit}`;

  if (queryParameters && queryParameters.labelSelector) {
    urlParams += `&labelSelector=${encodeURIComponent(queryParameters.labelSelector)}`;
  }

  if (queryParameters && queryParameters.fieldSelector) {
    urlParams += `&fieldSelector=${encodeURIComponent(queryParameters.fieldSelector)}`;
  }

  if (queryParameters && queryParameters.continueToken) {
    urlParams += `&continue=${queryParameters.continueToken}`;  // token already encoded!
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${componentName}::list-${resourceKind}`,
  };

  return new Promise<IKubernetesResourceList>((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: `${uri}${urlParams}`,
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

        // parse the response content
        const resourcesList = httpUtils.safeJSONParse(ctx, body);
        if (!resourcesList) {
          const errMessage = `Failed to convert response.body to JSON - URL: ${options.urls}${options.path} - Status: ${response && response.statusCode}`;
          logger.error(ctx, errMessage);
          logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
          return reject(new Error(errMessage));
        }

        logger.trace(ctx, `${fn}- resourcesList: ${JSON.stringify(resourcesList)}`);

        // check whether resources list is of kind 'ServiceList' or 'RevisionList'
        if (resourcesList.kind && resourcesList.kind.endsWith('List') && Array.isArray(resourcesList.items)) {

          // TODO paging -> https://kubernetes.io/docs/reference/using-api/api-concepts/#retrieving-large-results-sets-in-chunks

          // sort the resource by creation date
          resourcesList.items.sort(compareResourceByCreationTimestamp);

          logger.debug(ctx, `${fn}< Retrieved ${resourcesList.items.length} ${resourceKind} resources`);
          resolve(resourcesList);
        } else {
          logger.debug(ctx, `${fn}< EMPTY list`);
          resolve({ items: [], metadata: {} } as IKubernetesResourceList);
        }
      } else {
        // set the HTTP status code into the error
        error = httpUtils.getEnhancedErrorObj(error, response);

        logger.error(ctx, `Error listing ${resourceKind}s within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - responseBody: '${body && JSON.stringify(body)}'`, error);
        logger.debug(ctx, `${fn}< ERR - '${JSON.stringify(error)}'`);
        reject(new Error(JSON.stringify(error)));
      }
    });
  });
}

/**
 * This function creates a kube resource.
 *
 * @param {Log4jsLogger} logger - the logger to use
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} componentName - the component that issued the call
 * @param {String} uri - the URI to access the resource
 * @param {String} resourceKind - the kind of the resource
 * @param {object} resourceToCreate - the resource to create
 */
export function createKubeResource(logger, ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, componentName: string, uri: string, resourceKind: string, resourceToCreate: any): Promise<any> {
  const fn = 'createKubeResource ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', componentName: '${componentName}', uri: '${uri}', resourceKind: '${resourceKind}', resourceToCreate: '${JSON.stringify(resourceToCreate)}'`);

  // input check
  if (!accessDetails.serviceEndpointBaseUrl || !accessDetails.accessToken || !resourceToCreate) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and resourceToCreate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${componentName}::create-${resourceKind}`,
  };

  const resourceToCreateName = resourceToCreate && resourceToCreate.metadata && resourceToCreate.metadata.name;

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: resourceToCreate,
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'POST',
      path: uri,
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

        const rawResourceObj = httpUtils.safeJSONParse(ctx, body);
        logger.trace(ctx, `${fn}- ${resourceKind} resource: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          logger.debug(ctx, `${fn}< ${rawResourceObj.kind}: ${(rawResourceObj.metadata && rawResourceObj.metadata.name) ? rawResourceObj.metadata.name : 'NAME_NOT_SET'}`);
          resolve(rawResourceObj);
        } else {
          // TODO error handling needs to be revisited
          error = httpUtils.getEnhancedErrorObj(error, response);
          error.message = `Failed to create the ${resourceKind} of '${resourceToCreateName}' within namespace '${accessDetails.name}'`;

          logger.debug(ctx, `${fn}< REJECTING`);
          reject(error);
        }
      } else {
        error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);
        const errorMessage = `Error creating ${resourceKind} within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - responseBody: '${body && JSON.stringify(body)}'`;

        logger.error(ctx, errorMessage, error);
        logger.debug(ctx, `${fn}< ERR - '${JSON.stringify(error)}'`);
        reject(new commonErrors.KubeApiError(error, errorMessage));
      }
    });
  });
}

/**
 * Functions that updates a kube resource
 *
 * @param {Log4jsLogger} logger - the logger to use
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} componentName - the component that issued the call
 * @param {String} uri - the URI to access the resource
 * @param {String} resourceKind - the kind of the resource
 * @param {object} resourceToUpdate - the resource to update
 */
export function updateKubeResource(logger, ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, componentName: string, uri: string, resourceKind: string, resourceToUpdate: any): Promise<any> {
  const fn = 'updateKubeResource ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', componentName: '${componentName}', uri: '${uri}', resourceKind: '${resourceKind}', resourceToUpdate: '${JSON.stringify(resourceToUpdate)}'`);

  // input check
  if (!accessDetails.serviceEndpointBaseUrl || !accessDetails.accessToken || !resourceToUpdate) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and resourceToCreate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${componentName}::update-${resourceKind}`,
  };

  const resourceName = resourceToUpdate.metadata.name;

  logger.debug(ctx, `${fn}- update payload: '${JSON.stringify(resourceToUpdate)}'`);

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: resourceToUpdate,
      headers: getCommonHeaders(ctx, accessDetails.accessToken, 'application/merge-patch+json'),
      json: true,
      method: 'PATCH',
      path: uri,
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

        const updatedResource = httpUtils.safeJSONParse(ctx, body);
        if (!updatedResource) {
          const errMessage = `Failed to convert response.body to JSON. Failed update operation of ${resourceKind} within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - responseBody: '${body && JSON.stringify(body)}'`;
          logger.error(ctx, errMessage);
          logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
          return reject(new Error(errMessage));
        }
        logger.trace(`${fn}- update ${resourceKind} '${resourceName}': ${JSON.stringify(updatedResource)}`);

        // return the updated resource
        logger.debug(ctx, `${fn}<`);
        return resolve(updatedResource);
      } else {
        // set the HTTP status currentValues into the error
        error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

        logger.error(ctx, `Error updating ${resourceKind} within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - responseBody: '${body && JSON.stringify(body)}'`, error);
        logger.debug(ctx, `${fn}< ERROR - ${JSON.stringify(error)}`);
        return reject(new Error(JSON.stringify(error)));
      }
    });
  });
}

/**
 * This function deletes a kube resource
 *
 * @param {Log4jsLogger} logger - the logger to use
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} componentName - the component that issued the call
 * @param {String} uri - the URI to access the resource
 * @param {String} resourceKind - the kind of the resource
 * @param {String} resourceName - the name of the resource that should be deleted
 */
export function deleteKubeResource(logger, ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, componentName: string, uri: string, resourceKind: string, resourceName: string): Promise<IKubernetesStatus> {
  const fn = 'deleteKubeResource ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', componentName: '${componentName}', uri: '${uri}', resourceKind: '${resourceKind}', resourceName: '${resourceName}'`);

  // input check
  if (!accessDetails.serviceEndpointBaseUrl || !accessDetails.accessToken || !resourceName) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and resourceName must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const deletionPayload = { kind: 'DeleteOptions', apiVersion: 'v1' };

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${componentName}::delete-${resourceKind}`,
  };

  return new Promise<IKubernetesStatus>((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: deletionPayload,
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'DELETE',
      path: uri,
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

        const rawResourceObj = httpUtils.safeJSONParse(ctx, body);

        logger.debug(ctx, `${fn}- k8s deletion status: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          const resourceObj = rawResourceObj;
          logger.info(`deletion response payload: '${JSON.stringify(resourceObj)}'`);

          // TODO map the unstructured response object to a proper kube object

          logger.debug(ctx, `${fn}<`);
          resolve(resourceObj);
        } else {
          // TODO error handling needs to be revisited
          error = httpUtils.getEnhancedErrorObj(error, response);
          error.message = `Failed to delete the ${resourceKind} '${resourceName}' within namespace '${accessDetails.name}'`;

          logger.debug(ctx, `${fn}< REJECTING`);
          reject(error);
        }
      } else {
        error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

        logger.error(ctx, `Error deleting ${resourceKind} within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - responseBody: '${body && JSON.stringify(body)}'`, error);
        logger.debug(ctx, `${fn}< ERR - ${JSON.stringify(error)}`);
        reject(new Error(error));
      }
    });
  });
}
