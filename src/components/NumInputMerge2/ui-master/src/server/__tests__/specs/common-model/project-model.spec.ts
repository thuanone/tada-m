
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';

describe('project-model', () => {

  it('stringify a project', () => {

    const project: projectModel.IUIProject  = {
      crn: 'some-crn',
      id: 'some-id',
      kind: commonModel.UIEntityKinds.PROJECT,
      name: 'some-name',
      region: 'some-region',
    };

    const result: string = projectModel.stringify(project);
    expect(result).toBeDefined();
    expect(result).toEqual(`${project.kind}[name: ${project.name}]`);
  });

  it('stringify a project that has no name', () => {

    const project: projectModel.IUIProject  = {
      crn: 'some-crn',
      id: 'some-id',
      kind: commonModel.UIEntityKinds.PROJECT,
      name: undefined,
      region: 'some-region',
    };

    const result: string = projectModel.stringify(project);
    expect(result).toBeDefined();
    expect(result).toEqual(`${project.kind}[id: ${project.id}]`);
  });
});
