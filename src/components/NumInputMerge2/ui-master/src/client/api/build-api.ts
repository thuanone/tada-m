// 3rd-party
import * as log from 'loglevel';

// coligo
import * as buildModel from '../../common/model/build-model';
import * as commonModel from './../../common/model/common-model';
import utils from './utils';
import * as segment from '../utils/segment';

const env = window.armada;
const config = env.config;

const logger = log.getLogger('api/build-api');

export function createBuild(regionId: string, projectId: string, build: buildModel.IUIBuild, always?: any) {
  const fn = 'createBuild ';
  logger.debug(`${fn}>`);

  const createResult = utils.doPost({
    data: JSON.stringify(build),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/build`,
  });

  return new Promise((resolve, reject) => {
    createResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.BUILD, build.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.BUILD, build.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function updateBuild(regionId: string, projectId: string, build: buildModel.IUIBuild, always?: any) {
  const fn = 'updateBuild ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', build: '${buildModel.stringify(build)}'`);

  const buildName = build.name;

  const updateResult = utils.doPut({
    data: JSON.stringify(build),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/build/${buildName}`,
  });

  return new Promise((resolve, reject) => {
    updateResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededUpdateEvent(commonModel.SegmentCodeEngineObjectTypes.BUILD, build.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedUpdateEvent(commonModel.SegmentCodeEngineObjectTypes.BUILD, build.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function deleteBuild(regionId: string, projectId: string, buildName: string, always?: any) {
  const fn = 'deleteBuild ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', buildName: '${buildName}'`);

  const deleteResult = utils.doDelete({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/build/${buildName}`,
  });

  return new Promise((resolve, reject) => {
    deleteResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.BUILD, buildName);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.BUILD, buildName);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

// =============================================
// BuildRun
// =============================================

export function createBuildRun(regionId: string, projectId: string, buildRun: buildModel.IUIBuildRun, always?: any) {
  const fn = 'createBuildRun ';
  logger.debug(`${fn}>`);

  const createResult = utils.doPost({
    data: JSON.stringify(buildRun),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/buildrun`,
  });

  return new Promise((resolve, reject) => {
    createResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, buildRun.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, buildRun.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function deleteBuildRun(regionId: string, projectId: string, buildRunName: string, always?: any) {
  const fn = 'deleteBuildRun ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', buildRunName: '${buildRunName}'`);

  const deleteResult = utils.doDelete({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/buildrun/${buildRunName}`,
  });

  return new Promise((resolve, reject) => {
    deleteResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, buildRunName);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.BUILDRUN, buildRunName);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}
