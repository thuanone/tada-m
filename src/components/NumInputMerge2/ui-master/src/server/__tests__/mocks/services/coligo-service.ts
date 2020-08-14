import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as projectResourceModel from '../../../ts/model/project-resource-model';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';
export const REGION_ID_THAT_CAUSES_ERROR: string = 'valid-regionId_backenderrors';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_1: string = 'a1aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_2: string = 'a2aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_3: string = 'a3aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_ACCESS_DETAILS: accessDetailsModel.IAccessDetails = {
  accessToken: 'some-access-token',
  guid: 'some-access-token',
  name: PROJECT_ID,
  region: REGION_ID,
  serviceEndpointBaseUrl: 'https://some.iks.host',
};

export const DUMMY_TENANT_STATUS: projectResourceModel.ITenantStatus = {
  Domainstatus: 'Ready',
  Namespacestatus: 'Ready',
};

export const DUMMY_PROJECT_INFO: projectResourceModel.IProjectInfo = {
  Domainstatus: 'Ready',
  ExpireTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 5,
  Namespacestatus: 'Ready',
};

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

export function retrieveNamespaceAccessDetails(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<accessDetailsModel.IAccessDetails> {
  return new Promise((resolve, reject) => {
    if ([ PROJECT_ID, PROJECT_ID_1, PROJECT_ID_2, PROJECT_ID_3].includes(projectId)) {
      const accessDetails = cloneObject(DUMMY_ACCESS_DETAILS);
      accessDetails.name = projectId;
      return resolve(accessDetails);
    }

    if (projectId === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export async function getTenantStatus(ctx: commonModel.IUIRequestContext, clusterId: string, cloudResourceGuid: string): Promise<projectResourceModel.ITenantStatus> {
  return new Promise((resolve, reject) => {
    if ([ PROJECT_ID, PROJECT_ID_1, PROJECT_ID_2, PROJECT_ID_3].includes(cloudResourceGuid)) {
      const tenanentStatus = cloneObject(DUMMY_TENANT_STATUS);
      return resolve(tenanentStatus);
    }

    if (cloudResourceGuid === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.FailedToGetTenantStatusError(cloudResourceGuid);
    }

    throw new Error('some exception');
  });
}

export async function getProjectInfo(ctx: commonModel.IUIRequestContext, clusterId: string, cloudResourceGuid: string): Promise<projectResourceModel.IProjectInfo> {
  return new Promise((resolve, reject) => {
    if ([ PROJECT_ID, PROJECT_ID_1, PROJECT_ID_2, PROJECT_ID_3].includes(cloudResourceGuid)) {
      const projectInfo = cloneObject(DUMMY_PROJECT_INFO);
      return resolve(projectInfo);
    }

    if (cloudResourceGuid === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.FailedToGetProjectInfoError(cloudResourceGuid);
    }

    throw new Error('some exception');
  });
}
