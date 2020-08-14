// 3rd-party
import * as log from 'loglevel';

// coligo
import * as commonModel from './../../common/model/common-model';
import * as jobModel from '../../common/model/job-model';
import utils from './utils';
import * as segment from '../utils/segment';

const env = window.armada;
const config = env.config;

const logger = log.getLogger('api/job-api');

export function createJobDefinition(regionId: string, projectId: string, jobDefinition: jobModel.IUIJobDefinition, always?: any) {
  const fn = 'createJobDefinition ';
  logger.debug(`${fn}>`);

  const createResult = utils.doPost({
    data: JSON.stringify(jobDefinition),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/jobdefinition`,
  });

  return new Promise((resolve, reject) => {
    createResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.JOBDEFINITION, jobDefinition.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.JOBDEFINITION, jobDefinition.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function updateJobDefinition(regionId: string, projectId: string, jobDefinition: jobModel.IUIJobDefinition, always?: any) {
  const fn = 'updateJobDefinition ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', jobDefinition: '${jobModel.stringify(jobDefinition)}'`);

  const jobDefinitionName = jobDefinition.name;

  const updateResult = utils.doPut({
    data: JSON.stringify(jobDefinition),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/jobdefinition/${jobDefinitionName}`,
  });

  return new Promise((resolve, reject) => {
    updateResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededUpdateEvent(commonModel.SegmentCodeEngineObjectTypes.JOBDEFINITION, jobDefinition.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedUpdateEvent(commonModel.SegmentCodeEngineObjectTypes.JOBDEFINITION, jobDefinition.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function deleteJobDefinition(regionId: string, projectId: string, jobDefinition: jobModel.IUIJobDefinition, always?: any) {
  const fn = 'deleteJobDefinition ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', jobDefinition: '${jobModel.stringify(jobDefinition)}'`);

  const deleteResult = utils.doDelete({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/jobdefinition/${jobDefinition.id}`,
  });

  return new Promise((resolve, reject) => {
    deleteResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.JOBDEFINITION, jobDefinition.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.JOBDEFINITION, jobDefinition.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function createJobRun(regionId: string, projectId: string, jobRun: jobModel.IUIJobRun, always?: any) {
  const fn = 'createJobRun ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', jobRun: '${jobModel.stringify(jobRun)}'`);

  const createResult = utils.doPost({
    data: JSON.stringify(jobRun),
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/job`,
  });

  return new Promise((resolve, reject) => {
    createResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.JOBRUN, jobRun.name);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.JOBRUN, jobRun.name);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function deleteJobRun(regionId: string, projectId: string, jobRunName: string, always?: any) {
  const fn = 'deleteJobRun ';
  logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}', jobRunName: '${jobRunName}'`);

  const deleteResult = utils.doDelete({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/job/${jobRunName}`,
  });

  return new Promise((resolve, reject) => {
    deleteResult.done((result: commonModel.IUIRequestResult) => {
      // send a tracking event
      segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.JOBRUN, jobRunName);

      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      // send a tracking event
      segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.JOBRUN, jobRunName);

      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}
