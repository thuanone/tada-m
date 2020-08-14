import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import * as middlewareUtils from '../../../ts/utils/middleware-utils';

export const RESOURCE_GROUP_ID: string = '11111111369d4f33b46a40808d0f98a5';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';
export const REGION_ID_THAT_CAUSES_ERROR: string = 'valid-regionId_backenderrors';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_PROJECT_FOR_CREATION: projectModel.IUIProject = {
  crn: 'some-crn',
  id: undefined,
  kind: commonModel.UIEntityKinds.PROJECT,
  name: PROJECT_ID,
  region: REGION_ID,
  resourceGroupId: RESOURCE_GROUP_ID,
};

export const DUMMY_PROJECT: projectModel.IUIProject = {
  crn: 'some-crn',
  id: 'foo',
  kind: commonModel.UIEntityKinds.PROJECT,
  name: 'some-name',
  region: 'some-region',
};

export const DUMMY_PROJECT_STATUS: projectModel.IUIProjectStatus = {
  domain: true,
  tenant: true,
};

const DUMMY_RESOURCE_GROUP: projectModel.IUIResourceGroup = {
  crn: 'some-crn',
  default: true,
  id: 'foo',
  name: 'some-name',
  state: 'active',
};

const DUMMY_REGION: projectModel.IUIRegion = {
  id: 'foo',
};

export function getProject(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projectModel.IUIProject> {
  return new Promise((resolve, reject) => {
    if (projectId === PROJECT_ID) {
      return resolve(DUMMY_PROJECT);
    }

    if (projectId === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getProjectStatus(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projectModel.IUIProjectStatus> {
  return new Promise((resolve, reject) => {
    if (projectId === PROJECT_ID) {
      return resolve(DUMMY_PROJECT_STATUS);
    }

    if (projectId === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listProjects(ctx: commonModel.IUIRequestContext, regionId?: string): Promise<projectModel.IUIProjects> {
  return new Promise((resolve, reject) => {
    if (regionId === 'valid-regionId') {
      return resolve([DUMMY_PROJECT]);
    }

    if (regionId === 'valid-regionId_backendfails') {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listResourceGroups(ctx: commonModel.IUIRequestContext, regionId?: string): Promise<projectModel.IUIResourceGroups> {
  return Promise.resolve([DUMMY_RESOURCE_GROUP]);
}

export function listRegions(ctx: commonModel.IUIRequestContext): Promise<projectModel.IUIRegion[]> {
  return Promise.resolve([DUMMY_REGION]);
}

export function createProject(ctx: commonModel.IUIRequestContext, projectToCreate: projectModel.IUIProject): Promise<projectModel.IUIProject> {
  return new Promise((resolve, reject) => {
    if (projectToCreate && projectToCreate.name === PROJECT_ID) {
      return resolve(DUMMY_PROJECT);
    }

    if (projectToCreate && projectToCreate.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteProject(ctx: commonModel.IUIRequestContext, projectId: string): Promise<commonModel.IUIOperationResult> {
  return new Promise((resolve, reject) => {
    if (projectId === PROJECT_ID) {
      // craft a UIOperationResult
      const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);
      return resolve(operationResult);
    }

    if (projectId === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
