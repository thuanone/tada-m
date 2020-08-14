
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';

describe('config-model', () => {

  it('stringify a secret', () => {

    const secret: configModel.IUISecret  = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.SECRET,
      name: 'some-name',
      regionId: 'some-region',
      type: 'Generic',
    };

    const result: string = configModel.stringify(secret);
    expect(result).toBeDefined();
    expect(result).toEqual(`${secret.kind}[name: ${secret.name} type: ${secret.type}]`);
  });

  it('stringify a secret that has no name', () => {

    const secret: configModel.IUISecret  = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.SECRET,
      name: undefined,
      regionId: 'some-region',
      type: 'Generic',
    };

    const result: string = configModel.stringify(secret);
    expect(result).toBeDefined();
    expect(result).toEqual(`${secret.kind}[id: ${secret.id} type: ${secret.type}]`);
  });
});
