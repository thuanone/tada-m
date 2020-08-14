import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';
import * as confmapMiddlewareMock from './confmap-middleware';
import * as secretMiddlewareMock from './secret-middleware';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

type IUIConfigs = any[];

export const DUMMY_COMPONENT: configModel.IUIConfigMap = {
    data: [ {key: 'foo', value: 'bar'}],
    id: 'foo',
    kind: commonModel.UIEntityKinds.CONFMAP,
    name: 'foo',
    regionId: 'some-region',
  };

export function listConfigItems(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<IUIConfigs> {
    return new Promise((resolve, reject) => {
        if (regionId === REGION_ID) {
          return resolve([confmapMiddlewareMock.DUMMY_CONFMAP, secretMiddlewareMock.DUMMY_SECRET]);
        }

        if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
          throw new commonErrors.UnknownError();
        }

        throw new Error('some exception');
      });
}
