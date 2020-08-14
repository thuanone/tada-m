import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as k8sModel from '../../../ts/model/k8s-model';

export const CONFMAP_ID: string = 'some-service';
export const CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR: string = 'some-service-causes-backend-error';
export const CONFMAP_ID_THAT_CAUSES_EXCEPTION: string = 'some-service-causes-exception';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_2: string = 'a2aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_CONFMAP: k8sModel.IKubernetesConfigMap = {
  apiVersion: 'v1',
  data: {
    foo: 'bar',
  },
  kind: 'ConfigMap',
  metadata: {
    creationTimestamp: undefined,
    name: CONFMAP_ID,
  },
};

export const DUMMY_CONFMAPS: any = {
  apiVersion: 'v1',
  items: [DUMMY_CONFMAP],
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

export function getKubeConfigMapsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: k8sModel.IKubernetesQueryParameters): Promise<k8sModel.IKubernetesConfigMaps> {
  return new Promise((resolve, reject) => {
    if (accessDetails.name === PROJECT_ID || accessDetails.name === PROJECT_ID_2) {
      return resolve(DUMMY_CONFMAPS);
    }

    if (accessDetails.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getKubeConfigMap(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName: string, labelSelector?: string): Promise<k8sModel.IKubernetesConfigMap> {
  return new Promise((resolve, reject) => {
    if (resourceName === CONFMAP_ID) {
      return resolve(DUMMY_CONFMAP);
    }

    if (resourceName === CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
export function deleteKubeConfigMap(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (serviceId === CONFMAP_ID) {
      return resolve(DUMMY_DELETION_STATUS);
    }

    if (serviceId === CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createKubeConfigMap(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, confMapToCreate: k8sModel.IKubernetesConfigMap): Promise<k8sModel.IKubernetesConfigMap> {
  return new Promise((resolve, reject) => {
    if (confMapToCreate.metadata.name === CONFMAP_ID) {
      return resolve(DUMMY_CONFMAP);
    }

    if (confMapToCreate.metadata.name === CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
