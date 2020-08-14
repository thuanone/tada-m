
const COMP_NAME = 'k8s-builds';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import * as buildModel from '../model/build-model';
import { IKubernetesAPIError, IKubernetesQueryParameters, IKubernetesStatus, IResourceStats } from '../model/k8s-model';
import * as commonK8sService from './common-k8s-service';

const RESOURCE_KIND_BUILD = 'build';
const RESOURCE_KIND_BUILDRUN = 'buildrun';

export function getNumberOfBuilds(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<IResourceStats> {
  const fn = 'getNumberOfBuilds ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);
  return getS2IBuilds(ctx, accessDetails)
      .then((resources) => {
          const numberOfItems = resources && resources.items && resources.items.length || 0;
          logger.debug(ctx, `${fn}< ${numberOfItems} builds`);
          return { id: commonModel.UIEntityKinds.BUILD, count: numberOfItems };
      })
      .catch((err) => {
          logger.debug(ctx, `${fn}< 0 - due to an ERR`);
          return { id: commonModel.UIEntityKinds.BUILD, count: 0 };
      });
}

/**
 * Retrieves all s2i builds of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getS2IBuilds(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: IKubernetesQueryParameters): Promise<buildModel.IBuilds> {
  const fn = 'getS2IBuilds ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  // input check
  if (accessDetails && !accessDetails.name) {
    const errorMsg = 'accessDetails.name must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/builds`;

  return new Promise((resolve, reject) => {
    commonK8sService.getKubeResourceList(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILD, queryParameters)
      .then((kubeResources) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResources);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetBuildsError(err));
      });
  });
}

/**
 * Retrieves a s2i build of the given service in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceName - the name of the build
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. '.knative.dev/service=hello-world')
 */
export function getS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName: string, labelSelector?: string): Promise<buildModel.IBuild> {
  const fn = 'getS2IBuild ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', resourceName: '${resourceName}', labelSelector: '${labelSelector}'`);

  // input check
  if (!accessDetails.name || !resourceName) {
    const errorMsg = 'accessDetails.name and resourceName must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/builds/${resourceName}`;

  return new Promise<buildModel.IBuild>((resolve, reject) => {
    commonK8sService.getKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILD, resourceName, labelSelector)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as buildModel.IBuild);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetBuildError(resourceName, err));
      });
  });
}

/**
 * This function creates a s2i build.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {IBuild} buildToCreate - the build to create
 */
export function createS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildToCreate: buildModel.IBuild): Promise<buildModel.IBuild> {
  const fn = 'createS2IBuild ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', buildToCreate: '${JSON.stringify(buildToCreate)}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !buildToCreate) {
    const errorMsg = 'accessDetails.name and buildToCreate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/builds`;

  return new Promise<buildModel.IBuild>((resolve, reject) => {
    commonK8sService.createKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILD, buildToCreate)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as buildModel.IBuild);
      })
      .catch((err) => {

        if (err instanceof commonErrors.KubeApiError) {
          const kubeError = err.details as IKubernetesAPIError;
          if (kubeError.reason === 'AlreadyExists') {
            logger.debug(ctx, `${fn}< - ERR - AlreadyExists`);
            return reject(new commonErrors.FailedToCreateBuildBecauseAlreadyExistsError(err.message, err));
          }
        }
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToCreateBuildError(err));
      });
  });
}

/**
 * This function updates a s2i build.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceName - the name of the build
 * @param {IBuild} buildToCreate - the build to create
 */
export function updateS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildName: string, buildToUpate: buildModel.IBuild): Promise<buildModel.IBuild> {
  const fn = 'updateS2IBuild ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', buildToUpate: '${buildToUpate}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !buildToUpate) {
    const errorMsg = 'accessDetails.name and buildToUpate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/builds/${buildName}`;

  return new Promise<buildModel.IBuild>((resolve, reject) => {
    commonK8sService.updateKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILD, buildToUpate)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as buildModel.IBuild);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToUpdateBuildError(buildName, err));
      });
  });
}

/**
 * This function deletes a s2i build.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} buildId - the build to delete
 */
export function deleteS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildId: string): Promise<IKubernetesStatus> {
  const fn = 'deleteS2IBuild ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', buildId: '${buildId}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !buildId) {
    const errorMsg = 'accessDetails.name and buildId must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/builds/${buildId}`;

  return new Promise<IKubernetesStatus>((resolve, reject) => {
    commonK8sService.deleteKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILD, buildId)
      .then((kubeResource: IKubernetesStatus) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToDeleteBuildError(err));
      });
  });
}

export function getNumberOfBuildRuns(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<IResourceStats> {
  const fn = 'getNumberOfBuildRuns ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);
  return getS2IBuildRuns(ctx, accessDetails)
      .then((resources) => {
          const numberOfItems = resources && resources.items && resources.items.length || 0;
          logger.debug(ctx, `${fn}< ${numberOfItems} build runs`);
          return { id: commonModel.UIEntityKinds.BUILDRUN, count: numberOfItems };
      })
      .catch((err) => {
          logger.debug(ctx, `${fn}< 0 - due to an ERR`);
          return { id: commonModel.UIEntityKinds.BUILDRUN, count: 0 };
      });
}

/**
 * Retrieves all s2i build runs of the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} queryParameters - *optional* define a field selector that should be appended to the query (e.g. 'serving.knative.dev/service=hello-world')
 */
export function getS2IBuildRuns(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildId?: string, queryParameters?: IKubernetesQueryParameters): Promise<buildModel.IBuildRuns> {
  const fn = 'getS2IBuildRuns ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  // input check
  if (accessDetails && !accessDetails.name) {
    const errorMsg = 'accessDetails.name must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // if a buildId is specified we need to filter for all buildruns that are related to the given build by using a field selector
  if (buildId) {
    if (!queryParameters) {
      queryParameters = {};
    }
    queryParameters.labelSelector = `build.build.dev/name=${encodeURIComponent(buildId)}`;
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/buildruns`;

  return new Promise((resolve, reject) => {
    commonK8sService.getKubeResourceList(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILDRUN, queryParameters)
      .then((kubeResources) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResources);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetBuildRunsError(err));
      });
  });
}

/**
 * Retrieves a s2i buildrun in the given namespaces. Note: the user must have proper RBAC roles to do that.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} resourceName - the name of the buildrun
 * @param {String} labelSelector - *optional* define a label selector that should be appended to the query (e.g. '.knative.dev/service=hello-world')
 */
export function getS2IBuildRun(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName: string, labelSelector?: string): Promise<buildModel.IBuildRun> {
  const fn = 'getS2IBuildRun ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', resourceName: '${resourceName}', labelSelector: '${labelSelector}'`);

  // input check
  if (!accessDetails.name || !resourceName) {
    const errorMsg = 'accessDetails.name and resourceName must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/buildruns/${resourceName}`;

  return new Promise<buildModel.IBuildRun>((resolve, reject) => {
    commonK8sService.getKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILD, resourceName, labelSelector)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as buildModel.IBuildRun);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToGetBuildRunError(resourceName, err));
      });
  });
}

/**
 * This function creates a s2i buildrun.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {IBuildRun} buildRunToCreate - the buildrun to create
 */
export function createS2IBuildRun(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildRunToCreate: buildModel.IBuildRun): Promise<buildModel.IBuildRun> {
  const fn = 'createS2IBuildRun ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', buildToCreate: '${JSON.stringify(buildRunToCreate)}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !buildRunToCreate) {
    const errorMsg = 'accessDetails.name and buildRunToCreate must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // By specifying a generate name instead of name, we are forcing kube to append a "random" id
  buildRunToCreate.metadata.generateName = `${buildRunToCreate.spec.buildRef.name}-run-`;
  delete buildRunToCreate.metadata.name;

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/buildruns`;

  return new Promise<buildModel.IBuildRun>((resolve, reject) => {
    commonK8sService.createKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILDRUN, buildRunToCreate)
      .then((kubeResource: any) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource as buildModel.IBuildRun);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< - ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToCreateBuildRunError(err));
      });
  });
}

/**
 * This function deletes a s2i build.
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {IAccessDetails} accessDetails - the access details that are necessary to access the namespace
 * @param {String} buildId - the build to delete
 */
export function deleteS2IBuildRun(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildRunId: string): Promise<IKubernetesStatus> {
  const fn = 'deleteS2IBuildRun ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', buildRunId: '${buildRunId}'`);

  // input check
  if (!accessDetails || !accessDetails.name || !buildRunId) {
    const errorMsg = 'accessDetails.name and buildRunId must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  const uri = `/apis/${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}/namespaces/${accessDetails.name}/buildruns/${buildRunId}`;

  return new Promise<IKubernetesStatus>((resolve, reject) => {
    commonK8sService.deleteKubeResource(logger, ctx, accessDetails, COMP_NAME, uri, RESOURCE_KIND_BUILDRUN, buildRunId)
      .then((kubeResource: IKubernetesStatus) => {
        logger.debug(ctx, `${fn}<`);
        resolve(kubeResource);
      })
      .catch((err) => {
        logger.debug(ctx, `${fn}< ERR`);
        // wrap the error object in a specifc coligo error object
        reject(new commonErrors.FailedToDeleteBuildRunError(err));
      });
  });
}
