import * as commonModel from './../../common/model/common-model';
import utils from './utils';
import * as segment from '../utils/segment';

import * as appModel from '../../common/model/application-model';
import * as projectModel from '../../common/model/project-model';

const env = window.armada;
const config = env.config;

export function doInvokeApplication(application: appModel.IUIApplication, endpointUrl: string, always?) {
  const payload = {
    url: endpointUrl,
  };

  return new Promise((resolve, reject) => {
    utils
      .doPost({
        data: JSON.stringify(payload),
        url: `${config.proxyRoot}api/core/v1/region/${application.regionId}/project/${application.projectId}/application/${application.name}/invoke`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededCustomEvent(commonModel.SegmentCustomEventActions.APPLICATION_INVOKE, commonModel.SegmentCodeEngineObjectTypes.APPLICATION, application.name);

        resolve(requestResult);
      })
      .fail((xhr) => {
        // send a tracking event
        segment.failedCustomEvent(commonModel.SegmentCustomEventActions.APPLICATION_INVOKE, commonModel.SegmentCodeEngineObjectTypes.APPLICATION, application.name);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}

export function saveApplicationRevision(application: appModel.IUIApplication, revisionToSave: appModel.IUIApplicationRevision, always?) {

  return new Promise((resolve, reject) => {
    utils
      .doPost({
        data: JSON.stringify(revisionToSave),
        url: `${config.proxyRoot}api/core/v1/region/${application.regionId}/project/${application.projectId}/application/${application.name}/revision`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION_REVISION, revisionToSave.name);

        resolve(requestResult);
      })
      .fail((xhr) => {
        // send a tracking event
        segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION_REVISION, revisionToSave.name);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}

export function createNewApplication(applicationToCreate: appModel.IUIApplication, project: projectModel.IUIProject, always?) {

  return new Promise((resolve, reject) => {
    utils
      .doPost({
        data: JSON.stringify(applicationToCreate),
        url: `${config.proxyRoot}api/core/v1/region/${project.region}/project/${project.id}/application`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededCreationEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION, applicationToCreate.name);

        resolve(requestResult);
      })
      .fail((xhr) => {
        // send a tracking event
        segment.failedCreationEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION, applicationToCreate.name);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}

export function deleteApp(regionId: string, projectId: string, appName: string, always?) {

  return new Promise((resolve, reject) => {
    utils
      .doDelete({
        url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/application/${appName}`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION, appName);

        resolve(requestResult);
      })
      .fail((xhr) => {
        // send a tracking event
        segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION, appName);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}

export function deleteApplication(applicationToDelete: appModel.IUIApplication, always?) {

  return new Promise((resolve, reject) => {
    utils
      .doDelete({
        url: `${config.proxyRoot}api/core/v1/region/${applicationToDelete.regionId}/project/${applicationToDelete.projectId}/application/${applicationToDelete.name}`,
      })
      .done((requestResult: commonModel.IUIRequestResult) => {
        // send a tracking event
        segment.succeededDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION, applicationToDelete.name);

        resolve(requestResult);
      }).fail((xhr) => {
        // send a tracking event
        segment.failedDeletionEvent(commonModel.SegmentCodeEngineObjectTypes.APPLICATION, applicationToDelete.name);

        reject(utils.transformErrorResponse(xhr));
      })
      .always(always);
  });
}
