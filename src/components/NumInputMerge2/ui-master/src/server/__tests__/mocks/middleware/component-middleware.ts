import * as commonErrors from '../../../../common/Errors';
import * as appModel from '../../../../common/model/application-model';
import * as commonModel from '../../../../common/model/common-model';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

type IUIComponents = any[];

export const DUMMY_COMPONENT: appModel.IUIApplication = {
    id: 'foo',
    kind: commonModel.UIEntityKinds.APPLICATION,
    name: 'foo',
    regionId: 'some-region',
  };

export function listComponents(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<IUIComponents> {
    return new Promise((resolve, reject) => {
        if (regionId === REGION_ID) {
          return resolve([DUMMY_COMPONENT]);
        }

        if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
          throw new commonErrors.UnknownError();
        }

        throw new Error('some exception');
      });
}
