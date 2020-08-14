import { IResources } from './../model/knative-model';

const COMP_NAME = 'k8s-knative';

import * as appModel from '../../../common/model/application-model';
import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import * as commonErrors from './../../../common/Errors';
import * as knativeModel from './../model/knative-model';

import * as resiliency from '@console/console-platform-resiliency';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import { IKubernetesQueryParameters, IResourceStats } from '../model/k8s-model';
import * as monitoringModel from '../model/monitoring-model';
import * as httpUtils from '../utils/http-utils';
import * as monitorUtils from '../utils/monitoring-utils';

function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken: string) {
  return Object.assign({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'cache-control': 'max-age=0, no-cache, no-store',
  }, httpUtils.getCommonHeaders(ctx, accessToken));
}

export function getNumberOfKnServices(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<IResourceStats> {
  const fn = 'getKnServicesOfNamespace ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);
  return getKnServingResourceList(ctx, accessDetails, 'services')
    .then((resources) => {
      const numberOfItems = resources && resources.items && resources.items.length || 0;
      logger.debug(ctx, `${fn}< ${numberOfItems} applications`);
      return { id: commonModel.UIEntityKinds.APPLICATION, count: numberOfItems };
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< 0 - due to an ERR`);
      return { id: commonModel.UIEntityKinds.APPLICATION, count: 0 };
    });
}

/**
 * Retrieves all knative services of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKnServicesOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: IKubernetesQueryParameters): Promise<IResources> {
  const fn = 'getKnServicesOfNamespace ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  return new Promise((resolve, reject) => {
    getKnServingResourceList(ctx, accessDetails, 'services', queryParameters).then(
      (resources) => { resolve(resources); },
      (error) => { reject(error); }
    );
  });
}

/**
 * Get the creation timestamp of a resource from it's metadata field
 * @param resource  A service or revision
 */
function getResourceTimestamp(resource) {
  let result = (resource.metadata && resource.metadata.creationTimestamp) ? Date.parse(resource.metadata.creationTimestamp) : -1;
  if (isNaN(result)) {
    // could not parse date -> treat as if no date was set in the first place
    result = -1;
  }

  return result;
}

function compareResource(a, b) {
  const timeA = getResourceTimestamp(a);
  const timeB = getResourceTimestamp(b);

  return timeB - timeA;
}

/**
 * Retrieves all knative services of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceKind ('service' or 'revision')
 * @param {String} queryParameters - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
function getKnServingResourceList(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceKind, queryParameters?: IKubernetesQueryParameters): Promise<IResources> {
  const fn = 'getKnServingResourceList ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', resourceKind: '${resourceKind}', queryParameters: '${queryParameters && JSON.stringify(queryParameters)}'`);

  // input check
  if (!accessDetails.name || !resourceKind) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and resourceKind must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  if (resourceKind !== 'services' && resourceKind !== 'revisions') {
    const errorMsg = 'resourceKind must be either "services" or "revisions"';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const limit = (queryParameters && queryParameters.limit) ? queryParameters.limit : 500;

  let urlParams = `?limit=${limit}`;

  if (queryParameters && queryParameters.labelSelector) {
    urlParams += `&labelSelector=${encodeURIComponent(queryParameters.labelSelector)}`;
  }

  if (queryParameters && queryParameters.continueToken) {
    urlParams += `&continue=${queryParameters.continueToken}`;  // token already encoded!
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::getKnServingResourceList:${resourceKind}`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: `/apis/${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}/namespaces/${accessDetails.name}/${resourceKind}${urlParams}`,
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
          const resourcesList = JSON.parse(body);

          logger.trace(ctx, `${fn}- resourcesList: ${JSON.stringify(resourcesList)}`);

          // check whether resources list is of kind 'ServiceList' or 'RevisionList'
          if (resourcesList && resourcesList.kind.endsWith('List') && Array.isArray(resourcesList.items)) {

            // TODO paging -> https://kubernetes.io/docs/reference/using-api/api-concepts/#retrieving-large-results-sets-in-chunks

            // sort the resource by creation date
            resourcesList.items.sort(compareResource);

            logger.debug(ctx, `${fn}< Retrieved ${resourcesList.items.length} '${resourceKind}'`);
            resolve(resourcesList);
          } else {
            logger.debug(ctx, `${fn}< EMPTY list`);
            resolve({ items: [], metadata: {} } as IResources);
          }
        } catch (e) {
          logger.error(ctx, `failed to convert response.body to JSON - URL: ${options.urls}${options.path} - Status: ${response && response.statusCode}`, error);
          logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
          reject(e);
        }
      } else {
        // set the HTTP status code into the error
        error = httpUtils.getEnhancedErrorObj(error, response);

        let errorToReject = error;
        if (!(error instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `Error getting Knative ${resourceKind} of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path}`, error);

          // wrap the error object in a specifc coligo error object
          if (resourceKind === 'revisions') {
            errorToReject = new commonErrors.FailedToGetApplicationRevisionsError(error);
          } else {
            errorToReject = new commonErrors.FailedToGetApplicationError(error);
          }
        }

        logger.debug(ctx, `${fn}< ERR - ${JSON.stringify(errorToReject)}`);
        reject(errorToReject);
      }
    });
  });
}

/**
 * Retrieves a knative serving resource of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceKind - the kind of the resource to fetch. Must be either 'services', 'configurations', 'revisions' or 'routes'
 * @param {String} resourceName - the name of the resource (e.g. the name of the service, or of a revision)
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
function getKnServingResource(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceKind, resourceName, labelSelector) {
  const fn = 'getKnServingResource ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', resourceKind: '${resourceKind}', resourceName: '${resourceName}', labelSelector: '${labelSelector}'`);

  // input check
  if (!accessDetails.name || !resourceKind || !resourceName) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace, resourceName and resourceKind must be set properly';
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
    name: `${COMP_NAME}::getKnServingResource:${resourceKind}`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'GET',
      path: `/apis/${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}/namespaces/${accessDetails.name}/${resourceKind}/${resourceName}${urlParams}`,
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

        const rawResourceObj = JSON.parse(body);

        logger.trace(ctx, `${fn}- service resource: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          const resourceObj = rawResourceObj;

          logger.debug(ctx, `${fn}< ${rawResourceObj.kind}: ${(resourceObj.metadata && resourceObj.metadata.name) ? resourceObj.metadata.name : 'NAME_NOT_SET'}`);
          resolve(resourceObj);
        } else {
          logger.debug(ctx, `${fn}< REJECTING`);
          reject(`Could not retrieve the Knative ${resourceKind} of '${resourceName}' within namespace '${accessDetails.name}'`);
        }

      } else {
        // set the HTTP status code into the error
        error = httpUtils.getEnhancedErrorObj(error, response);

        logger.error(ctx, `Error getting Knative ${resourceKind} of '${resourceName}' within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path}`, error);
        logger.debug(ctx, `${fn}< ERROR`);
        reject(error);
      }
    });
  });
}

/**
 * Retrieves a knative service object of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} serviceName - the name of the service
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKnService(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName: string, labelSelector?: string): Promise<knativeModel.IKnativeService> {
  return new Promise<knativeModel.IKnativeService>((resolve, reject) => {
    getKnServingResource(ctx, accessDetails, 'services', serviceName, labelSelector).then(
      (resource: knativeModel.IKnativeService) => { resolve(resource); },
      (error) => { reject(error); }
    );
  });
}

/**
 * Retrieves a knative service route of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} serviceName - the name of the service
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKnServiceRoute(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName, labelSelector?: string): Promise<knativeModel.IKnativeRoute> {
  return new Promise((resolve, reject) => {
    getKnServingResource(ctx, accessDetails, 'routes', serviceName, labelSelector).then(
      (resource: knativeModel.IKnativeRoute) => { resolve(resource); },
      (error) => { reject(error); }
    );
  });
}

/**
 * Retrieves a knative service configuration of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} serviceName - the name of the service
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKnServiceConfiguration(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName, labelSelector?: string): Promise<knativeModel.IKnativeConfiguration> {
  return new Promise((resolve, reject) => {
    getKnServingResource(ctx, accessDetails, 'configurations', serviceName, labelSelector).then(
      (resource) => { resolve(resource); },
      (error) => { reject(error); }
    );
  });
}

/**
 * Retrieves a knative service revision of the given revision in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} revisionName - the name of the revision (e.g. 'helloworld1-rrp8p')
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKnServiceRevision(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, revisionName, labelSelector?: string): Promise<knativeModel.IKnativeRevision> {
  return new Promise<knativeModel.IKnativeRevision>((resolve, reject) => {
    getKnServingResource(ctx, accessDetails, 'revisions', revisionName, labelSelector).then(
      (resource: knativeModel.IKnativeRevision) => { resolve(resource); },
      (error) => { reject(error); }
    );
  });
}

/**
 * Retrieves a knative service revision of the given revision in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} serviceName - the name of the service
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKnServiceRevisions(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName, labelSelector?: string): Promise<knativeModel.IKnativeRevision[]> {

  if (!labelSelector) {
    // if the given labelSelector is not set, initialize an empty string
    labelSelector = '';
  } else {
    // if there is already a labelSelector set, append a comma
    labelSelector += ',';
  }

  // add a label selector to retrieve all revisions of a certain service
  labelSelector += `serving.knative.dev/service=${serviceName}`;

  return new Promise((resolve, reject) => {
    getKnServingResourceList(ctx, accessDetails, 'revisions',
      {
        labelSelector,
        limit: 500,
      }).then(
        (resources: IResources) => {
          // TODO: if we want/need to support continuation support for Revisions as well, we MUST return the 'resources' object instead of the items here!
          resolve(resources.items as knativeModel.IKnativeRevision[]);
        },
        (error) => { reject(error); }
      );
  });
}

/**
 * This function creates a Knative Service.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {IKnativeService} serviceToCreate - the service to create
 */
export function createKnService(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceToCreate: knativeModel.IKnativeService): Promise<knativeModel.IKnativeService> {
  const fn = 'createKnService ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', serviceToCreate: '${JSON.stringify(serviceToCreate)}'`);

  // input check
  if (!accessDetails.name || !serviceToCreate) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and service must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const resourceKind = 'services';

  // TODO abstract this and move it away

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::createKnService:${resourceKind}`,
  };

  return new Promise((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: serviceToCreate,
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'POST',
      path: `/apis/${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}/namespaces/${accessDetails.name}/${resourceKind}`,
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

        // in oder to avoid "SyntaxError: Unexpected token o in JSON at position 1" issues
        // the response body is converted to a string, first
        const rawResourceObj = JSON.parse(JSON.stringify(body));

        logger.debug(ctx, `${fn}- service resource: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          const resourceObj = rawResourceObj;

          // TODO map the unstructured response object to a Knative Service object
          const createdService: knativeModel.IKnativeService = {
            apiVersion: resourceObj.apiVersion,
            kind: rawResourceObj.kind,
            metadata: {
              creationTimestamp: resourceObj.metadata.creationTimestamp,
              name: resourceObj.metadata.name,
              namespace: resourceObj.metadata.namespace,
              uid: resourceObj.metadata.uid,
            },
            spec: resourceObj.spec,
          };

          logger.debug(ctx, `${fn}< ${rawResourceObj.kind}: ${(createdService.metadata && createdService.metadata.name) ? createdService.metadata.name : 'NAME_NOT_SET'}`);
          resolve(createdService);
        } else {
          // TODO error handling needs to be revisited
          error = httpUtils.getEnhancedErrorObj(error, response);
          error.message = `Failed to create the Knative ${resourceKind} of '${serviceToCreate.metadata.name}' within namespace '${accessDetails.name}'`;

          logger.debug(ctx, `${fn}< REJECTING`);
          reject(error);
        }
      } else {
        error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

        let errorToReject = error;
        if (!(error instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `Error creating Knative ${resourceKind} of '${serviceToCreate.metadata.name}' within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: '${JSON.stringify(error)}'`);

          // wrap the error object in a specifc coligo error object
          if (error.reason === 'AlreadyExists') {
            errorToReject = new commonErrors.FailedToCreateApplicationBecauseAlreadyExistsError(error);
          } else if (error.reason === 'BadRequest') {
            errorToReject = new commonErrors.FailedToCreateApplicationBecauseBadRequestError(error.message);
          } else {
            errorToReject = new commonErrors.FailedToCreateApplicationError(error);
          }
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(errorToReject)}`);
        reject(errorToReject);
      }
    });
  });
}

/**
 * This function creates a Knative Service Revision.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} serviceId - the identifier (name or uid) of the service
 * @param {knativeModel.IKnativeService} knService - the service and the revision to create
 */
export function createKnServiceRevision(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string, knService: knativeModel.IKnativeService): Promise<knativeModel.IKnativeService> {
  const fn = 'createKnServiceRevision ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', serviceId: '${serviceId}', knService: '${JSON.stringify(knService)}'`);

  // input check
  if (!accessDetails.name || !serviceId || !knService) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespaceName, serviceId and knService must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const resourceKind = 'services';

  const payload = knService;
  logger.debug(ctx, `${fn}- payload: ${JSON.stringify(payload)}`);

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::createKnServiceRevision:${resourceKind}`,
  };

  return new Promise<knativeModel.IKnativeService>((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: payload,
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'PUT',
      path: `/apis/${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}/namespaces/${accessDetails.name}/${resourceKind}/${serviceId}`,
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

        // in oder to avoid "SyntaxError: Unexpected token o in JSON at position 1" issues
        // the response body is converted to a string, first
        const rawResourceObj = JSON.parse(JSON.stringify(body));

        logger.debug(ctx, `${fn}- service resource: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          const resourceObj = rawResourceObj;

          logger.debug(ctx, `${fn}< ${rawResourceObj.kind}: ${(resourceObj.metadata && resourceObj.metadata.name) ? resourceObj.metadata.name : 'NAME_NOT_SET'}`);
          resolve(resourceObj);
        } else {
          // TODO error handling needs to be revisited
          error = httpUtils.getEnhancedErrorObj(error, response);
          error.message = `Failed to create new revision of Knative ${resourceKind} of '${serviceId}' within namespace '${accessDetails.name}'`;

          logger.debug(ctx, `${fn}< REJECTING`);
          reject(error);
        }

      } else {
        error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

        let errorToReject = error;
        if (!(error instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `Error creating revision for Knative ${resourceKind} of '${serviceId}' within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} error: '${JSON.stringify(error)}'`);

          // wrap the error object in a specifc coligo error object
          if (error.reason === 'BadRequest') {
            errorToReject = new commonErrors.FailedToCreateApplicationRevisionBecauseBadRequestError(error.message);
          } else {
            errorToReject = new commonErrors.FailedToCreateApplicationRevisionError(error);
          }
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(errorToReject)}`);
        reject(errorToReject);
      }
    });
  });
}

/**
 * This function deletes a Knative Service.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} serviceId - the service to delete
 */
export function deleteKnService(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string): Promise<knativeModel.IKnativeStatus> {
  const fn = 'deleteKnService ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', serviceId: '${serviceId}'`);

  // input check
  if (!accessDetails.name || !serviceId) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and serviceId must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const resourceKind = 'services';
  const deletionPayload = { kind: 'DeleteOptions', apiVersion: `${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}` };

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::deleteKnService:${resourceKind}`,
  };

  return new Promise<knativeModel.IKnativeStatus>((resolve, reject) => {
    const options = {
      cachePolicy: 'NO_CACHE',
      data: deletionPayload,
      headers: getCommonHeaders(ctx, accessDetails.accessToken),
      json: true,
      method: 'DELETE',
      path: `/apis/${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}/namespaces/${accessDetails.name}/${resourceKind}/${serviceId}`,
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

        const rawResourceObj = JSON.parse(body);

        logger.debug(ctx, `${fn}- k8s deletion status: ${JSON.stringify(rawResourceObj)}`);

        // check whether the given object is defined and has got the property kind
        if (rawResourceObj && rawResourceObj.kind) {

          const resourceObj = rawResourceObj;

          // TODO map the unstructured response object to a Knative Service object
          const deletionStatus: knativeModel.IKnativeStatus = {
            apiVersion: resourceObj.apiVersion,
            details: resourceObj.details,
            kind: rawResourceObj.kind,
            metadata: resourceObj.metadata,
            status: resourceObj.status
          };

          logger.debug(ctx, `${fn}< ${deletionStatus.kind}: ${deletionStatus.status}`);
          resolve(deletionStatus);
        } else {
          // TODO error handling needs to be revisited
          error = httpUtils.getEnhancedErrorObj(error, response);
          error.message = `Failed to delete the Knative ${resourceKind} '${serviceId}' within namespace '${accessDetails.name}'`;

          logger.debug(ctx, `${fn}< REJECTING`);
          reject(error);
        }
      } else {
        error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

        let errorToReject = error;
        if (!(error instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `Error deleting Knative ${resourceKind} '${serviceId}' within namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path}`, error);

          // wrap the error object in a specifc coligo error object
          errorToReject = new commonErrors.FailedToDeleteApplicationError(error);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(errorToReject)}`);
        reject(errorToReject);
      }
    });
  });
}

export function executeHttpCall(ctx: commonModel.IUIRequestContext, baseHost: string, verb: string, headers: { [key: string]: string }, payload: any) {
  const fn = 'executeHttpCall ';
  logger.debug(ctx, `${fn}> baseHost: '${baseHost}', verb: '${verb}'`);

  // we need to ensure that we are using SSL for all outgoing calls
  if (baseHost) {
    baseHost = baseHost.replace('http://', 'https://');
  }

  return new Promise((resolve, reject) => {

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
      kind: 'backend',
      name: `${COMP_NAME}::invokeKnService`,
    };

    const options = {
      cachePolicy: 'NO_CACHE',
      data: payload,
      headers,
      method: verb,
      path: '/',
      strictSSL: true,
      urls: baseHost,
    };

    resiliency.request(options, (error, response, body) => {
      const endTime = Date.now();
      const duration = Date.now() - startTime;

      // check whether the request was successful
      const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

      // log the backend call
      monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

      // create a performance monitoring entry
      monitorUtils.storePerfMonitorEntry(monitor, duration);

      if (httpUtils.isHttpResponseOk(error, response)) {
        const invocationResult: appModel.IUIApplicationInvocationResult = {
          durationInMillis: duration,
          endTime,
          responseBody: body,
        };

        logger.debug(ctx, `${fn}< duration: ${duration}ms`);
        resolve(invocationResult);
      } else {
        if (!error) {
          error = {};
        }

        if (response && response.statusCode) {
          error.statusCode = response.statusCode;
        }

        logger.error(ctx, `${fn}- Error executing HTTP ${verb} ${baseHost}`, error);
        logger.debug(ctx, `${fn}< ERROR - duration: ${duration}ms`);
        reject(error);
      }
    });
  });
}
