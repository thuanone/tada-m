import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';
import * as middlewareUtils from '../../../ts/utils/middleware-utils';

export const RESOURCE_GROUP_ID: string = '11111111369d4f33b46a40808d0f98a5'; // pragma: allowlist secret

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

export const CONFMAP_ID: string = 'valid-appid';
export const CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-appid-but-backendfails';
export const CONFMAP_ID_THAT_CAUSES_ERROR: string = 'valid-appid-but-exception';

export const DUMMY_CONFMAP_FOR_CREATION: configModel.IUIConfigMap = {
  data: [{ key: 'foo', value: 'bar'}],
  id: CONFMAP_ID,
  kind: commonModel.UIEntityKinds.CONFMAP,
  name: CONFMAP_ID,
  regionId: REGION_ID,
};

export const DUMMY_CONFMAP: configModel.IUIConfigMap = {
  data: [{ key: 'foo', value: 'bar'}],
  id: 'foo',
  kind: commonModel.UIEntityKinds.CONFMAP,
  name: 'foo',
  regionId: 'some-region',
};

export function getConfigMap(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string): Promise<configModel.IUIConfigMap> {
  return new Promise((resolve, reject) => {
    if (secretId === CONFMAP_ID) {
      return resolve(DUMMY_CONFMAP);
    }

    if (secretId === CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listConfigMaps(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<configModel.IUIConfigMap[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_CONFMAP]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createConfigMap(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretToCreate: configModel.IUIConfigMap): Promise<configModel.IUIConfigMap> {
  return new Promise((resolve, reject) => {
    if (secretToCreate && secretToCreate.name === CONFMAP_ID) {
      return resolve(DUMMY_CONFMAP);
    }

    if (secretToCreate && secretToCreate.name === CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteConfigMap(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string): Promise<commonModel.IUIOperationResult> {
  return new Promise((resolve, reject) => {
    if (secretId === CONFMAP_ID) {
      // craft a UIOperationResult
      const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);
      return resolve(operationResult);
    }

    if (secretId === CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
