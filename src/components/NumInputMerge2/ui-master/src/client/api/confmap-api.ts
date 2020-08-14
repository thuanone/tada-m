// 3rd-party
import * as log from 'loglevel';

// coligo
import * as commonModel from './../../common/model/common-model';
import * as configModel from '../../common/model/config-model';
import utils from './utils';
import * as segment from '../utils/segment';

const env = window.armada;
const config = env.config;

const logger = log.getLogger('api/confmap-api');

export function createConfigMap(regionId: string, projectId: string, confMap: configModel.IUIConfigMap, always?: any) {
  const fn = 'createConfigMap ';
  logger.debug(`${fn}>`);

  const createResult = utils.doPost({
    data: JSON.stringify(confMap),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/confmap`,
  });

  return new Promise((resolve, reject) => {
    createResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, confMap.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, confMap.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function getConfigMap(regionId: string, projectId: string, confMapName: string, always?: any): Promise<configModel.IUIConfigMap> {
  const fn = 'getConfigMap ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', confMapName: '${confMapName}'`);

  const getResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/confmap/${confMapName}`,
  });

  return new Promise((resolve, reject) => {
    getResult.done((result: commonModel.IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function deleteConfigMap(regionId: string, projectId: string, confMapName: string, always?: any) {
  const fn = 'deleteConfigMap ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', confMapName: '${confMapName}'`);

  const deleteResult = utils.doDelete({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/confmap/${confMapName}`,
  });

  return new Promise((resolve, reject) => {
    deleteResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, confMapName);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, confMapName);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}
