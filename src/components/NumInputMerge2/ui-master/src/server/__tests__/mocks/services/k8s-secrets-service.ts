import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as k8sModel from '../../../ts/model/k8s-model';

import * as secretsService from '../../../ts/services/k8s-secrets-service';

export const SECRET_ID: string = 'some-service';
export const SECRET_ID_THAT_CAUSES_BACKEND_ERROR: string = 'some-service-causes-backend-error';
export const SECRET_ID_THAT_CAUSES_EXCEPTION: string = 'some-service-causes-exception';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_2: string = 'a2aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_SECRET: k8sModel.IKubernetesSecret = {
  apiVersion: 'v1',
  data: {
    foo: 'bar',
  },
  kind: 'Secret',
  metadata: {
    creationTimestamp: undefined,
    name: SECRET_ID,
  },
  type: 'Opaque',
};

export const DUMMY_SECRETS: any = {
  apiVersion: 'v1',
  items: [DUMMY_SECRET],
  kind: 'List',
  metadata: {
  },
};

export const DUMMY_DELETION_STATUS: any = {
  apiVersion: 'v1',
  details: {},
  kind: 'Status',
  metadata: {},
  status: 'Success',
};

export function getFieldSelectorForFilteringSecrets(secretType?: string) {
  return secretsService.getFieldSelectorForFilteringSecrets(secretType);
}

export function getKubeSecretsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: k8sModel.IKubernetesQueryParameters): Promise<k8sModel.IKubernetesSecrets> {
  return new Promise((resolve, reject) => {
    if (accessDetails.name === PROJECT_ID || accessDetails.name === PROJECT_ID_2) {
      return resolve(DUMMY_SECRETS);
    }

    if (accessDetails.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getKubeSecret(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName: string, labelSelector?: string): Promise<k8sModel.IKubernetesSecret> {
  return new Promise((resolve, reject) => {
    if (resourceName === SECRET_ID) {
      return resolve(DUMMY_SECRET);
    }

    if (resourceName === SECRET_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
export function deleteKubeSecret(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (serviceId === SECRET_ID) {
      return resolve(DUMMY_DELETION_STATUS);
    }

    if (serviceId === SECRET_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createKubeSecret(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, secretToCreate: k8sModel.IKubernetesSecret): Promise<k8sModel.IKubernetesSecret> {
  return new Promise((resolve, reject) => {
    if (secretToCreate.metadata.name === SECRET_ID) {
      return resolve(DUMMY_SECRET);
    }

    if (secretToCreate.metadata.name === SECRET_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
