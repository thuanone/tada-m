// 3rd-party
import * as log from 'loglevel';

// coligo
import * as commonModel from './../../common/model/common-model';
import * as configModel from '../../common/model/config-model';
import utils from './utils';
import * as segment from '../utils/segment';

const env = window.armada;
const config = env.config;

const logger = log.getLogger('api/secret-api');

export function createSecret(regionId: string, projectId: string, secret: configModel.IUIGenericSecret | configModel.IUIRegistrySecret, always?: any) {
  const fn = 'createSecret ';
  logger.debug(`${fn}>`);

  const createResult = utils.doPost({
    data: JSON.stringify(secret),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/secret`,
  });

  return new Promise((resolve, reject) => {
    createResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.SECRET, secret.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.SECRET, secret.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function getSecret(regionId: string, projectId: string, secretName: string, includeCredentials?: boolean, always?: any): Promise<configModel.IUIGenericSecret | configModel.IUIRegistrySecret> {
  const fn = 'getSecret ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', secretName: '${secretName}'`);

  const headers = {};

  logger.debug(`${fn} includeCredentials = ${includeCredentials}`);

  if (includeCredentials) {
    headers['x-ce-include-credentials'] = 'true';
  }

  const getResult = utils.doGet({
    headers,
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/secret/${secretName}`,
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

export function deleteSecret(regionId: string, projectId: string, secretName: string, always?: any) {
  const fn = 'deleteSecret ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', secretName: '${secretName}'`);

  const deleteResult = utils.doDelete({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/secret/${secretName}`,
  });

  return new Promise((resolve, reject) => {
    deleteResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.SECRET, secretName);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.SECRET, secretName);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}
