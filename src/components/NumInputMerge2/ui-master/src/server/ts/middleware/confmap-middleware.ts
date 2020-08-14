
import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as commonConfigModel from '../../../common/model/config-model';

import * as confMapMapper from '../mapper/confmap-mapper';

import { IAccessDetails } from '../model/access-details-model';
import * as k8sModel from '../model/k8s-model';

import * as blueProm from 'bluebird';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:confmap');

import * as k8sConfigMapService from '../services/k8s-confmap-service';
import * as helpers from './common-middleware';

import * as middlewareUtils from '../utils/middleware-utils';

export function getConfigMap(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, confMapId: string): Promise<commonConfigModel.IUIConfigMap> {
  const fn = 'getConfigMap ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', confMapId: '${confMapId}'`);

  return new Promise<commonConfigModel.IUIConfigMap>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    const kubeApiAccessDetailsProm = helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx);

    const k8sConfigMapProm = kubeApiAccessDetailsProm.then((kubeAccessDetails: IAccessDetails) => (
      // retrieve the confMap
      k8sConfigMapService.getKubeConfigMap(ctx, kubeAccessDetails, confMapId)
    ));

    // use bluebird join function to wait for the results of both calls
    blueProm.join(kubeApiAccessDetailsProm, k8sConfigMapProm, (kubeAccessDetails: IAccessDetails, kubeConfigMap: k8sModel.IKubernetesConfigMap) => {

      // map the IKubernetesConfigMap to an IUIConfigMap
      const uiConfigMap: commonConfigModel.IUIConfigMap = confMapMapper.convertKubeConfigMapToUiConfigMap(kubeConfigMap, regionId, projectId);

      // send the confMap object back to the client
      logger.debug(ctx, `${fn}< ${commonConfigModel.stringify(uiConfigMap)}`);
      resolve(uiConfigMap);
      return;

    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to get the confMap '${confMapId}' in region '${regionId}' and project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetConfigMapError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listConfigMaps(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<commonConfigModel.IUIConfigMap[]> {
  const fn = 'listConfigMaps ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

  return new Promise<commonConfigModel.IUIConfigMap[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (
        // retrieve the all kn services of the given namespace
        k8sConfigMapService.getKubeConfigMapsOfNamespace(ctx, kubeAccessDetails)
      ))
      .then((resources) => {
        const kubeConfigMaps: k8sModel.IKubernetesConfigMap[] = resources.items;
        // map the IKubernetesConfigMap to an IUIConfigMap
        const uiConfigMaps: commonConfigModel.IUIConfigMap[] = confMapMapper.convertKubeConfigMapsToUiConfigMaps(kubeConfigMaps, regionId, projectId);

        logger.debug(ctx, `${fn}< ${uiConfigMaps ? uiConfigMaps.length : 'NULL'} confMaps`);
        resolve(uiConfigMaps);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the applications in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetConfigMapsError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

/**
 * This method is responsible for creating a new confMap in the given project
 * @param regionId - the id of the region (e.g. us-south)
 * @param projectId - the project guid of a coligo project
 * @param confMapToCreate - the confMap that should be created
 * @param ctx - the request context
 */
export function createConfigMap(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, confMapToCreate: commonConfigModel.IUIConfigMap): Promise<commonConfigModel.IUIConfigMap> {
  const fn = 'createConfigMap ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', confMapToCreate: '${JSON.stringify(confMapToCreate)}'`);

  // convert the UI confMap to an kube confMap
  const kubeConfigMapToCreate: k8sModel.IKubernetesConfigMap = confMapMapper.convertUiConfigMapToKubeConfigMap(confMapToCreate);

  return new Promise<commonConfigModel.IUIConfigMap>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // create the kube confMap
        return k8sConfigMapService.createKubeConfigMap(ctx, kubeAccessDetails, kubeConfigMapToCreate);
      })
      .then((createdService: k8sModel.IKubernetesConfigMap) => {
        logger.debug(ctx, `${fn}- created kubernetes confMap: '${JSON.stringify(createdService)}'`);

        // map the kube confMap to an UIConfigMap
        const createdConfigMap: commonConfigModel.IUIConfigMap = confMapMapper.convertKubeConfigMapToUiConfigMap(createdService, regionId, projectId);

        logger.debug(ctx, `${fn}< '${commonConfigModel.stringify(createdConfigMap)}'`);
        resolve(createdConfigMap);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the confMap in region '${regionId}' and project '${projectId}'`, error);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateConfigMapError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function deleteConfigMap(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, confMapId: string): Promise<commonModel.IUIOperationResult> {
  const fn = 'deleteConfigMap ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', confMapId: '${confMapId}'`);

  return new Promise<commonModel.IUIOperationResult>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // delete the service
        return k8sConfigMapService.deleteKubeConfigMap(ctx, kubeAccessDetails, confMapId)
          .then((deletionResult: any) => {

            // evaluate the deletion status
            const status = deletionResult.status === 'Success' ? commonModel.UIOperationStatus.OK : commonModel.UIOperationStatus.FAILED;

            // craft a UIOperationResult
            const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(status);

            logger.debug(ctx, `${fn}< '${JSON.stringify(operationResult)}'`);
            return resolve(operationResult);
          });
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to delete kube confMap '${confMapId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToDeleteConfigMapError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}
