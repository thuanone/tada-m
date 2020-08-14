import * as commonModel from './../../common/model/common-model';
import utils from './utils';
import * as segment from '../utils/segment';

import * as projectModel from '../../common/model/project-model';

const env = window.armada;
const config = env.config;

export function createNewProject(projectToCreate: projectModel.IUIProject, always?) {

  return new Promise((resolve, reject) => {
    utils
      .doPost({
        data: JSON.stringify(projectToCreate),
        url: `${config.proxyRoot}api/core/v1/project`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.PROJECT, projectToCreate.name);

        resolve(requestResult);
      })
      .fail((xhr) => {
        // send a tracking event
        segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.PROJECT, projectToCreate.name);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}

export function deleteProject(region: string, projectId: string, always?) {

  return new Promise((resolve, reject) => {
    utils
      .doDelete({
        url: `${config.proxyRoot}api/core/v1/region/${region}/project/${projectId}`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.PROJECT, projectId);

        resolve(requestResult);
      })
      .fail((xhr) => {
        // send a tracking event
        segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.PROJECT, projectId);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}

export function getAllProjects(always?) {
  return new Promise((resolve, reject) => {
    utils.doGet({
      url: `${config.proxyRoot}api/core/v1/region/all/projects`,
    }).done(resolve).fail((xhr) => { reject(utils.transformErrorResponse(xhr)); }).always(always);
  });
}

export function getRegions(always?) {
  return new Promise((resolve, reject) => {
    utils.doGet({
      url: `${config.proxyRoot}api/core/v1/regions`,
    }).done(resolve).fail((xhr) => { reject(utils.transformErrorResponse(xhr)); }).always(always);
  });
}

export function getProjectStatus(region: string, projectId: string, always?) {

  return new Promise((resolve, reject) => {
    utils.doGet({
      url: `${config.proxyRoot}api/core/v1/region/${region}/project/${projectId}/status`,
    }).done(resolve).fail((xhr) => { reject(utils.transformErrorResponse(xhr)); }).always(always);
  });
}
