const COMP_NAME = 'k8s-secrets';

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import { IKubernetesAPIError, IKubernetesQueryParameters, IKubernetesSecret, IKubernetesSecrets, IKubernetesStatus, IResourceStats } from '../model/k8s-model';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonK8sService from './common-k8s-service';

const RESOURCE_KIND_SECRET = 'secret';

export function getFieldSelectorForFilteringSecrets(secretType?: string) {
  if (!secretType) {
    return undefined;
  }

  if (secretType.toLowerCase() === 'registry') {
    return 'type=kubernetes.io/dockerconfigjson';
  }

  if (secretType.toLowerCase() === 'generic') {
    return 'type=Opaque';
  }
}

export function getNumberOfSecrets(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, secretType: string): Promise<IResourceStats> {
  const fn = 'getNumberOfSecrets ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', secretType: '${JSON.stringify(secretType)}'`);

  const resourceKind = secretType === 'registry' ? commonModel.UIEntityKinds.CONTAINERREGISTRY : commonModel.UIEntityKinds.SECRET;

  return getKubeSecretsOfNamespace(ctx, accessDetails, { fieldSelector: getFieldSelectorForFilteringSecrets(secretType) })
    .then((resources) => {
      const numberOfItems = resources && resources.items && resources.items.length || 0;
      logger.debug(ctx, `${fn}< ${numberOfItems} secrets`);
      return { id: resourceKind, count: numberOfItems };
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< 0 - due to an ERR`);
      return { id: resourceKind, count: 0 };
    });
}

/**
 * Retrieves all kube secrets of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getKubeSecretsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: IKubernetesQueryParameters): Promise<IKubernetesSecrets> {
  const fn = 'getKubeSecretsOfNamespace ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  // input check
  if (accessDetails && !accessDetails.name) {
    const errorMsg = 'accessDetails.name must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/secrets`;

  return new Promise((resolve, reject) => {
    commonK8sService.getKubeResourceList(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_SECRET, queryParameters)
      .then((kubeResources) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResources);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetSecretsError(err));
      });
  });
}

/**
 * Retrieves a kubernetes secret of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceName - the name of the secret
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. '.knative.dev/service=hello-world')
 */
export function getKubeSecret(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName, labelSelector?) {
  const fn = 'getKubeSecret ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', resourceName: '${resourceName}', labelSelector: '${labelSelector}'`);

  // input check
  if (!accessDetails.name || !resourceName) {
    const errorMsg = 'serviceEndpointBaseUrl, accessToken, namespace and resourceName must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/secrets/${resourceName}`;

  return new Promise<IKubernetesSecret>((resolve, reject) => {
    commonK8sService.getKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_SECRET, resourceName, labelSelector)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as IKubernetesSecret);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetSecretError(err));
      });
  });
}

/**
 * This function creates a kube secret.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {IKubernetesSecret} secretToCreate - the secret to create
 */
export function createKubeSecret(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, secretToCreate: IKubernetesSecret): Promise<IKubernetesSecret> {
  const fn = 'createKubeSecret ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', secretToCreate: '${JSON.stringify(secretToCreate)}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !secretToCreate) {
    const errorMsg = 'accessDetails.name and secretToCreate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/secrets`;

  return new Promise<IKubernetesSecret>((resolve, reject) => {
    commonK8sService.createKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_SECRET, secretToCreate)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as IKubernetesSecret);
      })
      .catch((err) => {

        if (err instanceof commonErrors.KubeApiError) {
          const kubeError = err.details as IKubernetesAPIError;
          if (kubeError.reason === 'AlreadyExists') {
            logger.debug(ctx, `${fn}< - ERR - AlreadyExists`);
            return reject(new commonErrors.FailedToCreateSecretBecauseAlreadyExistsError(err));
          }
        }
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToCreateSecretError(err));
      });
  });
}

/**
 * This function deletes a kube secret.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} secretId - the secret to delete
 */
export function deleteKubeSecret(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, secretId: string): Promise<any> {
  const fn = 'deleteKubeSecret ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', secretId: '${secretId}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !secretId) {
    const errorMsg = 'accessDetails.name and secretId must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/api/v1/namespaces/${accessDetails.name}/secrets/${secretId}`;

  return new Promise<IKubernetesStatus>((resolve, reject) => {
    commonK8sService.deleteKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_SECRET, secretId)
      .then((kubeResource: IKubernetesStatus) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToDeleteSecretError(err));
      });
  });
}
