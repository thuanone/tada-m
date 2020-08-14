
import * as applicationModel from '../../../../common/model/application-model';
import * as commonModel from '../../../../common/model/common-model';

describe('application-model', () => {

  it('stringify an app', () => {

    const app: applicationModel.IUIApplication  = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: 'some-name',
      regionId: 'some-region',
    };

    const result: string = applicationModel.stringify(app);
    expect(result).toBeDefined();
    expect(result).toEqual(`${app.kind}[name: ${app.name}]`);
  });

  it('stringify an app that has no name', () => {

    const app: applicationModel.IUIApplication  = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.APPLICATION,
      regionId: 'some-region',
    };

    const result: string = applicationModel.stringify(app);
    expect(result).toBeDefined();
    expect(result).toEqual(`${app.kind}[id: ${app.id}]`);
  });
});
