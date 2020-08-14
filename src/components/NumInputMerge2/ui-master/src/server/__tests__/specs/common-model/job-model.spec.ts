
import * as commonModel from '../../../../common/model/common-model';
import * as jobModel from '../../../../common/model/job-model';

describe('job-model', () => {

  it('stringify a jobdef', () => {

    const jobDef: jobModel.IUIJobDefinition  = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.JOBDEFINITION,
      name: 'some-name',
      regionId: 'some-region',
      spec: {
        image: 'some-image',
        imagePullSecret: 'some-secret',
      },
    };

    const result: string = jobModel.stringify(jobDef);
    expect(result).toBeDefined();
    expect(result).toEqual(`${jobDef.kind}[name: ${jobDef.name}]`);
  });

  it('stringify a jobdef that has no name', () => {

    const jobDef: jobModel.IUIJobDefinition  = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.JOBDEFINITION,
      regionId: 'some-region',
      spec: {
        image: 'some-image',
        imagePullSecret: 'some-secret',
      },
    };

    const result: string = jobModel.stringify(jobDef);
    expect(result).toBeDefined();
    expect(result).toEqual(`${jobDef.kind}[id: ${jobDef.id}]`);
  });
});
