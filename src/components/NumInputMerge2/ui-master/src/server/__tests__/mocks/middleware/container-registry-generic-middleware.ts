import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as commonContainerRegistryModel from '../../../../common/model/container-registry-model';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';
export const REGION_ID_THAT_CAUSES_ERROR: string = 'valid-regionId_fails';

export const REGISTRY_NAMESPACE_ID_ICR: string = 'valid-id_namespace';
export const REGISTRY_REPOSITORY_ID_ICR: string = 'valid-id_namespace';
export const REGISTRY_IMAGE_ID_ICR: string = 'valid-id_image';

export const DUMMY_REGISTRY_NAMESPACE: commonContainerRegistryModel.IUIContainerRegistryNamespace = {
  id: REGISTRY_NAMESPACE_ID_ICR,
  kind: commonModel.UIEntityKinds.CONTAINERREGISTRYNAMESPACE,
};

export const DUMMY_REGISTRY_REPOSITORY: commonContainerRegistryModel.IUIContainerRegistryRepository = {
  id: `${REGISTRY_NAMESPACE_ID_ICR}/${REGISTRY_REPOSITORY_ID_ICR}`,
  kind: commonModel.UIEntityKinds.CONTAINERREGISTRYREPOSITORY,
  namespace: REGISTRY_NAMESPACE_ID_ICR,
  repository: REGISTRY_REPOSITORY_ID_ICR,
};

export const DUMMY_REGISTRY_IMAGE: commonContainerRegistryModel.IUIContainerRegistryImage = {
  id: `${REGISTRY_NAMESPACE_ID_ICR}/${REGISTRY_REPOSITORY_ID_ICR}`,
  kind: commonModel.UIEntityKinds.CONTAINERREGISTRYIMAGE,
  tag: `${REGISTRY_NAMESPACE_ID_ICR}/${REGISTRY_REPOSITORY_ID_ICR}:${REGISTRY_IMAGE_ID_ICR}`,
  created: Date.now(),
  size: -1,
  registryKind: commonContainerRegistryModel.RegistryKind.IBM,
  namespace: REGISTRY_NAMESPACE_ID_ICR,
  repository: REGISTRY_REPOSITORY_ID_ICR,
  image: REGISTRY_IMAGE_ID_ICR,
};

export function listNamespacesOfRegistryServerDomain(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registryServer: string): Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_REGISTRY_NAMESPACE]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listNamespacesOfSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_REGISTRY_NAMESPACE]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listRepositories(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryRepository[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_REGISTRY_REPOSITORY]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listImages(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string, respositoryId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryImage[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_REGISTRY_IMAGE]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
