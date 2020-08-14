
import * as commonErrors from '../../../common/Errors';
import * as commonBuildsModel from '../../../common/model/build-model';
import * as commonModel from '../../../common/model/common-model';

import * as buildMapper from '../mapper/build-mapper';

import { IAccessDetails } from '../model/access-details-model';
import * as buildModel from '../model/build-model';

import * as blueProm from 'bluebird';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:build');

import * as k8sBuildService from '../services/k8s-build-service';
import * as helpers from './common-middleware';

import * as middlewareUtils from '../utils/middleware-utils';

export function getBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId: string): Promise<commonBuildsModel.IUIBuild> {
  const fn = 'getBuild ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildId: '${buildId}'`);

  return new Promise<commonBuildsModel.IUIBuild>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    const kubeApiAccessDetailsProm = helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx);

    const k8sBuildProm = kubeApiAccessDetailsProm.then((kubeAccessDetails: IAccessDetails) => (
      // retrieve the build
      k8sBuildService.getS2IBuild(ctx, kubeAccessDetails, buildId)
    ));

    // use bluebird join function to wait for the results of both calls
    blueProm.join(kubeApiAccessDetailsProm, k8sBuildProm, (kubeAccessDetails: IAccessDetails, kubeBuild: buildModel.IBuild) => {

      // map the IBuild to an IUIBuild
      const uiBuild: commonBuildsModel.IUIBuild = buildMapper.convertKubeBuildToUiBuild(kubeBuild, regionId, projectId);

      // send the build object back to the client
      logger.debug(ctx, `${fn}< ${commonBuildsModel.stringify(uiBuild)}`);
      resolve(uiBuild);
      return;

    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to get the build '${buildId}' in region '${regionId}' and project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetBuildError(buildId, err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listBuilds(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<commonBuildsModel.IUIBuild[]> {
  const fn = 'listBuilds ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

  return new Promise<commonBuildsModel.IUIBuild[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (
        // retrieve the all builds of the given namespace
        k8sBuildService.getS2IBuilds(ctx, kubeAccessDetails)
      ))
      .then((resources) => {
        const s2iBuilds: buildModel.IBuild[] = resources.items;
        // map the IBuild to an IUIBuild
        const uiBuilds: commonBuildsModel.IUIBuild[] = buildMapper.convertKubeBuildsToUiBuilds(s2iBuilds, regionId, projectId);

        logger.debug(ctx, `${fn}< ${uiBuilds ? uiBuilds.length : 'NULL'} build`);
        resolve(uiBuilds);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the s2i builds in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetBuildsError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

/**
 * This method is responsible for creating a new build in the given project
 * @param regionId - the id of the region (e.g. us-south)
 * @param projectId - the project guid of a coligo project
 * @param buildToCreate - the build that should be created
 * @param ctx - the request context
 */
export function createBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildToCreate: commonBuildsModel.IUIBuild): Promise<commonBuildsModel.IUIBuild> {
  const fn = 'createBuild ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildToCreate: '${JSON.stringify(buildToCreate)}'`);

  // convert the UI build to an s2i build
  const kubeBuildToCreate: buildModel.IBuild = buildMapper.convertUiBuildToKubeBuild(buildToCreate);

  return new Promise<commonBuildsModel.IUIBuild>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // create the kube build
        return k8sBuildService.createS2IBuild(ctx, kubeAccessDetails, kubeBuildToCreate);
      })
      .then((createdService: buildModel.IBuild) => {
        logger.debug(ctx, `${fn}- created s2i build: '${JSON.stringify(createdService)}'`);

        // map the kube build to an UIBuild
        const createdBuild: commonBuildsModel.IUIBuild = buildMapper.convertKubeBuildToUiBuild(createdService, regionId, projectId);

        logger.debug(ctx, `${fn}< '${commonBuildsModel.stringify(createdBuild)}'`);
        resolve(createdBuild);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the build in region '${regionId}' and project '${projectId}'`, error);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateBuildError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function updateBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId: string, buildToUpdate: commonBuildsModel.IUIBuild): Promise<commonBuildsModel.IUIBuild> {
  const fn = 'updateBuild ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildId: '${buildId}', buildToUpdate: '${commonBuildsModel.stringify(buildToUpdate)}'`);

  return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {
          // convert the UI build to an s2i build
          const kubeBuildToUpdate: buildModel.IBuild = buildMapper.convertUiBuildToKubeBuild(buildToUpdate);

          return k8sBuildService.updateS2IBuild(ctx, kubeAccessDetails, buildId, kubeBuildToUpdate);
      })
      .then((build: buildModel.IBuild) => {
          const result: commonBuildsModel.IUIBuild = buildMapper.convertKubeBuildToUiBuild(build, regionId, projectId);
          logger.debug(ctx, `${fn}<`);
          return result;
      })
      .catch((err) => {
          let error = err;
          if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to update the s2i build in region '${regionId}' and project '${projectId}'`, err);
            // wrap the error object in a specifc coligo error object
            error = new commonErrors.FailedToUpdateBuildError(buildId, err);
          }

          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
          throw error;
      });
}

export function deleteBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId: string): Promise<commonModel.IUIOperationResult> {
  const fn = 'deleteBuild ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildId: '${buildId}'`);

  return new Promise<commonModel.IUIOperationResult>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // delete the build
        return k8sBuildService.deleteS2IBuild(ctx, kubeAccessDetails, buildId)
          .then((deletionResult: any) => {

            // evaluate the deletion status
            const status = (deletionResult.status && deletionResult.status.reason === 'Succeeded') ? commonModel.UIOperationStatus.OK : commonModel.UIOperationStatus.FAILED;

            // craft a UIOperationResult
            const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(status);

            logger.debug(ctx, `${fn}< '${JSON.stringify(operationResult)}'`);
            return resolve(operationResult);
          });
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to delete s2i build '${buildId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToDeleteBuildError(buildId, err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

// =============================================
// BuildRun
// =============================================

export function getBuildRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildRunId: string): Promise<commonBuildsModel.IUIBuildRun> {
  const fn = 'getBuildRun ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildRunId: '${buildRunId}'`);

  return new Promise<commonBuildsModel.IUIBuildRun>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    const kubeApiAccessDetailsProm = helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx);

    const k8sBuildProm = kubeApiAccessDetailsProm.then((kubeAccessDetails: IAccessDetails) => (
      // retrieve the buildrun
      k8sBuildService.getS2IBuildRun(ctx, kubeAccessDetails, buildRunId)
    ));

    // use bluebird join function to wait for the results of both calls
    blueProm.join(kubeApiAccessDetailsProm, k8sBuildProm, (kubeAccessDetails: IAccessDetails, kubeRunBuild: buildModel.IBuildRun) => {

      // map the IBuildRun to an IUIBuildRun
      const uiBuildRun: commonBuildsModel.IUIBuildRun = buildMapper.convertKubeBuildRunToUiBuildRun(kubeRunBuild, regionId, projectId);

      // send the buildRun object back to the client
      logger.debug(ctx, `${fn}< ${commonBuildsModel.stringify(uiBuildRun)}`);
      resolve(uiBuildRun);
      return;

    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to get the buildRun '${buildRunId}' in region '${regionId}' and project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetBuildRunError(buildRunId, err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listBuildRuns(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId?: string): Promise<commonBuildsModel.IUIBuildRun[]> {
  const fn = 'listBuildRuns ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildId: '${buildId}'`);

  return new Promise<commonBuildsModel.IUIBuildRun[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (

        // retrieve the all build runs of the given namespace
        k8sBuildService.getS2IBuildRuns(ctx, kubeAccessDetails, buildId)
      ))
      .then((resources) => {
        const s2iBuildRuns: buildModel.IBuildRun[] = resources.items;
        // map the IBuildRun to an IUIBuildRun
        const uiBuildRuns: commonBuildsModel.IUIBuildRun[] = buildMapper.convertKubeBuildRunsToUiBuildRuns(s2iBuildRuns, regionId, projectId);

        logger.debug(ctx, `${fn}< ${uiBuildRuns ? uiBuildRuns.length : 'NULL'} build`);
        resolve(uiBuildRuns);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the s2i buildRuns in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetBuildRunsError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

/**
 * This method is responsible for creating a new buildRun in the given project
 * @param regionId - the id of the region (e.g. us-south)
 * @param projectId - the project guid of a coligo project
 * @param buildRunToCreate - the buildRun that should be created
 * @param ctx - the request context
 */
export function createBuildRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildRunToCreate: commonBuildsModel.IUIBuildRun): Promise<commonBuildsModel.IUIBuildRun> {
  const fn = 'createBuildRun ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildRunToCreate: '${JSON.stringify(buildRunToCreate)}'`);

  // convert the UI buildRun to an s2i build
  const kubeBuildRunToCreate: buildModel.IBuildRun = buildMapper.convertUiBuildRunToKubeBuildRun(buildRunToCreate);

  return new Promise<commonBuildsModel.IUIBuildRun>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // create the kube buildRun
        return k8sBuildService.createS2IBuildRun(ctx, kubeAccessDetails, kubeBuildRunToCreate);
      })
      .then((createdKubeBuildRun: buildModel.IBuildRun) => {
        logger.debug(ctx, `${fn}- created s2i buildRun: '${JSON.stringify(createdKubeBuildRun)}'`);

        // map the kube buildRun to an UIBuildRun
        const createdBuildRun: commonBuildsModel.IUIBuildRun = buildMapper.convertKubeBuildRunToUiBuildRun(createdKubeBuildRun, regionId, projectId);

        logger.debug(ctx, `${fn}< '${commonBuildsModel.stringify(createdBuildRun)}'`);
        resolve(createdBuildRun);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the buildRun in region '${regionId}' and project '${projectId}'`, error);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateBuildRunError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function deleteBuildRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildRunId: string): Promise<commonModel.IUIOperationResult> {
  const fn = 'deleteBuildRun ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', buildRunId: '${buildRunId}'`);

  return new Promise<commonModel.IUIOperationResult>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // delete the buildRun
        return k8sBuildService.deleteS2IBuildRun(ctx, kubeAccessDetails, buildRunId)
          .then((deletionResult: any) => {

            // evaluate the deletion status
            const status = (deletionResult.status === 'Success') ? commonModel.UIOperationStatus.OK : commonModel.UIOperationStatus.FAILED;

            // craft a UIOperationResult
            const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(status);

            logger.debug(ctx, `${fn}< '${JSON.stringify(operationResult)}'`);
            return resolve(operationResult);
          });
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to delete s2i buildRun '${buildRunId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToDeleteBuildRunError(buildRunId, err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}
