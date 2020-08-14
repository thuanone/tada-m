const COMP_NAME = 'k8s-confmap';

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import { IKubernetesAPIError,  IKubernetesConfigMap, IKubernetesConfigMaps, IKubernetesQueryParameters, IKubernetesStatus, IResourceStats } from '../model/k8s-model';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonK8sService from './common-k8s-service';

const RESOURCE_KIND_CONFMAP = 'configMap';

export function getNumberOfConfigMaps(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<IResourceStats> {
  const fn = 'getNumberOfConfigMaps ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  return getKubeConfigMapsOfNamespace(ctx, accessDetails)
      .then((resources) => {
          const numberOfItems = resources && resources.items && resources.items.length || 0;
          logger.debug(ctx, `${fn}< ${numberOfItems} config maps`);
          return { id: commonModel.UIEntityKinds.CONFMAP, count: numberOfItems };
      })
      .catch((err) => {
          logger.debug(ctx, `${fn}< 0 - due to an ERR`);
          return { id: commonModel.UIEntityKinds.CONFMAP, count: 0 };
      });
}

/**
 * Retrieves all kube confMaps of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKubeConfigMapsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: IKubernetesQueryParameters): Promise<IKubernetesConfigMaps> {
  const fn = 'getKubeConfigMapsOfNamespace ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  // input check
  if (accessDetails && !accessDetails.name) {
    const errorMsg = 'accessDetails.name must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/configmaps`;

  return new Promise((resolve, reject) => {
    commonK8sService.getKubeResourceList(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_CONFMAP, queryParameters)
      .then((kubeResources) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResources);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetConfigMapsError(err));
      });
  });
}

/**
 * Retrieves a kubernetes confMap of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceName - the name of the confMap
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. '.knative.dev/service=hello-world')
 */
export function getKubeConfigMap(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName, labelSelector?) {
  const fn = 'getKubeConfigMap ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', resourceName: '${resourceName}', labelSelector: '${labelSelector}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !resourceName) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and resourceName must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/configmaps/${resourceName}`;

  return new Promise<IKubernetesConfigMap>((resolve, reject) => {
    commonK8sService.getKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_CONFMAP, resourceName, labelSelector)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as IKubernetesConfigMap);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetConfigMapError(err));
      });
  });
}

/**
 * This function creates a kube ConfigMap.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {IKubernetesConfigMap} confMapToCreate - the confMap to create
 */
export function createKubeConfigMap(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, confMapToCreate: IKubernetesConfigMap): Promise<IKubernetesConfigMap> {
  const fn = 'createKubeConfigMap ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', confMapToCreate: '${JSON.stringify(confMapToCreate)}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !confMapToCreate) {
    const errorMsg = 'accessDetails.name and confMapToCreate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/configmaps`;

  return new Promise<IKubernetesConfigMap>((resolve, reject) => {
    commonK8sService.createKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_CONFMAP, confMapToCreate)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as IKubernetesConfigMap);
      })
      .catch((err) => {

        if (err instanceof commonErrors.KubeApiError) {
          const kubeError = err.details as IKubernetesAPIError;
          if (kubeError.reason === 'AlreadyExists') {
            logger.debug(ctx, `${fn}< - ERR - AlreadyExists`);
            return reject(new commonErrors.FailedToCreateConfigMapBecauseAlreadyExistsError(err));
          }
        }
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToCreateConfigMapError(err));
      });
  });
}

/**
 * This function deletes a Kube confMap.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} confMapId - the confMap to delete
 */
export function deleteKubeConfigMap(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, confMapId: string): Promise<any> {
  const fn = 'deleteKubeConfigMap ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', confMapId: '${confMapId}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !confMapId) {
    const errorMsg = 'accessDetails.name and confMapId must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/configmaps/${confMapId}`;

  return new Promise<IKubernetesStatus>((resolve, reject) => {
    commonK8sService.deleteKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_CONFMAP, confMapId)
      .then((kubeResource: IKubernetesStatus) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToDeleteConfigMapError(err));
      });
  });
}
