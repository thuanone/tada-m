import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as middlewareUtils from '../../../ts/utils/middleware-utils';
import * as dockerRegistryService from '../services/docker-registry-service';

export const RESOURCE_GROUP_ID: string = '11111111369d4f33b46a40808d0f98a5'; // pragma: allowlist secret

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

export const SECRET_ID: string = 'valid-id';
export const SECRET_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-id-but-backendfails';
export const SECRET_ID_THAT_CAUSES_ERROR: string = 'valid-id-but-exception';

export const REGISTRY_SECRET_ID_ICR: string = 'valid-id_icr';
export const REGISTRY_SECRET_ID_DOCKERHUB: string = 'valid-id_dockerhub';

export const DUMMY_SECRET_FOR_CREATION: configModel.IUIGenericSecret = {
  data: [{ key: 'foo', value: 'bar' }],
  id: SECRET_ID,
  kind: commonModel.UIEntityKinds.SECRET,
  name: SECRET_ID,
  regionId: REGION_ID,
  type: 'Generic',
};

export const DUMMY_SECRET: configModel.IUIGenericSecret = {
  data: [{ key: 'foo', value: 'bar' }],
  id: 'foo',
  kind: commonModel.UIEntityKinds.SECRET,
  name: 'foo',
  regionId: 'some-region',
  type: 'Generic',
};

export const DUMMY_REGISTRY_SECRET_ICR: configModel.IUIRegistrySecret = {
  id: REGISTRY_SECRET_ID_ICR,
  kind: commonModel.UIEntityKinds.SECRET,
  name: REGISTRY_SECRET_ID_ICR,
  regionId: 'some-region',
  type: 'Registry',
  server: 'us.icr.io',
  username: 'iamapikey',
  password: 'foo', // pragma: allowlist secret
};

export const DUMMY_REGISTRY_SECRET_DOCKER_HUB: configModel.IUIRegistrySecret = {
  id: REGISTRY_SECRET_ID_DOCKERHUB,
  kind: commonModel.UIEntityKinds.SECRET,
  name: REGISTRY_SECRET_ID_DOCKERHUB,
  regionId: 'some-region',
  type: 'Registry',
  server: 'docker.io',
  username: dockerRegistryService.USERNAME,
  password: 'bar', // pragma: allowlist secret
};

export function getSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string): Promise<configModel.IUISecret> {
  return new Promise((resolve, reject) => {
    if (secretId === SECRET_ID) {
      return resolve(DUMMY_SECRET);
    } else if (secretId === REGISTRY_SECRET_ID_ICR) {
      return resolve(DUMMY_REGISTRY_SECRET_ICR);
    } else if (secretId === REGISTRY_SECRET_ID_DOCKERHUB) {
      return resolve(DUMMY_REGISTRY_SECRET_DOCKER_HUB);
    }

    if (secretId === SECRET_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listSecrets(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<configModel.IUISecret[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_SECRET]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretToCreate: configModel.IUISecret): Promise<configModel.IUISecret> {
  return new Promise((resolve, reject) => {
    if (secretToCreate && secretToCreate.name === SECRET_ID) {
      return resolve(DUMMY_SECRET);
    }

    if (secretToCreate && secretToCreate.name === SECRET_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string): Promise<commonModel.IUIOperationResult> {
  return new Promise((resolve, reject) => {
    if (secretId === SECRET_ID) {
      // craft a UIOperationResult
      const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);
      return resolve(operationResult);
    }

    if (secretId === SECRET_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
