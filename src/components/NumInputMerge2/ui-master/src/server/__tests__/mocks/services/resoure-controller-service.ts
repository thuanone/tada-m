import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../ts/model/project-resource-model';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';
export const REGION_ID_THAT_CAUSES_ERROR: string = 'valid-regionId_backenderrors';

export const DUMMY_PROJECT_RESOURCE: projectModel.IProjectResource = {
  created: Date.now(),
  guid: 'some-guid',
  name: 'some-name',
  region: 'some-region',
  resource_group_id: 'some-resourcegroup-id',
  resource_plan_id: 'some-plan-id',
};

export const DUMMY_RESOURCE_GROUP: projectModel.IResourceGroup = {
  crn: 'some-crn',
  default: true,
  id: 'some-id',
  name: 'some-name',
  state: 'active',
};

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export function createProjectResource(ctx: commonModel.IUIRequestContext, resourceInstanceToCreate: projectModel.IProjectResource): Promise<projectModel.IProjectResource> {
  return new Promise((resolve, reject) => {
    if (resourceInstanceToCreate && resourceInstanceToCreate.name === PROJECT_ID) {
      return resolve(DUMMY_PROJECT_RESOURCE);
    }

    if (resourceInstanceToCreate && resourceInstanceToCreate.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getServiceStatus(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  return new Promise((resolve, reject) => {
    const resourceControllerStatus: commonModel.IUIServiceStatus = {
      id: 'resource-controller',
      status: 'OK',
    };
    resolve(resourceControllerStatus);
  });
}

export function getProjectResource(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projectModel.IProjectResource> {
  return new Promise((resolve, reject) => {
    if (projectId === PROJECT_ID) {
      return resolve(DUMMY_PROJECT_RESOURCE);
    }

    if (projectId === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getProjectResources(ctx: commonModel.IUIRequestContext, regionId: string): Promise<projectModel.IProjectResource[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_PROJECT_RESOURCE]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteProjectResource(ctx: commonModel.IUIRequestContext, projectId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    if (projectId === PROJECT_ID) {
      return resolve(200);
    }

    if (projectId === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getResourceGroups(ctx: commonModel.IUIRequestContext): Promise<projectModel.IResourceGroup[]> {
  return new Promise((resolve, reject) => {
    if (ctx) {
      return resolve([DUMMY_RESOURCE_GROUP]);
    }

    throw new Error('some exception');
  });
}
