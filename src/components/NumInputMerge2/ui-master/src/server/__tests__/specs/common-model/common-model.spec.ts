
import * as commonModel from '../../../../common/model/common-model';

describe('common-model', () => {

  it('stringify an object', () => {

    const some = {
      id: 'some-id',
      name: 'some-name',
    };

    const result: string = commonModel.stringify(some);
    expect(result).toBeDefined();
    expect(result).toEqual(`???[name: ${some.name}]`);
  });

  it('stringify an object that has no name', () => {

    const some = {
      id: 'some-id',
    };

    const result: string = commonModel.stringify(some);
    expect(result).toBeDefined();
    expect(result).toEqual(`???[id: ${some.id}]`);
  });
});
