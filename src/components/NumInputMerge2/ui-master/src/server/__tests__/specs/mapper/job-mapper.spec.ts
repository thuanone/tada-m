import * as fs from 'fs';
import * as commonModel from '../../../../common/model/common-model';
import * as commonJobModel from '../../../../common/model/job-model';
import * as jobModel from '../../../ts/model/job-model';
import { IUIEnvItemLiteral } from '../../../../common/model/common-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

describe('job mapper', () => {
  let jobMapper: any;

  beforeEach(() => {
    jobMapper = proxyquire('../../../ts/mapper/job-mapper', {
    });
  });

  it('returns null if the given input is invali (mapColigoJobRunToUIJobRun)', () => {
    // input is undefined
    let resource: any;
    let result = jobMapper.mapColigoJobRunToUIJobRun(resource);
    expect(result).toBeUndefined();

    // input is empty
    resource = {};
    result = jobMapper.mapColigoJobRunToUIJobRun(resource);
    expect(result).toBeUndefined();

    // input is a string
    resource = 'string';
    result = jobMapper.mapColigoJobRunToUIJobRun(resource);
    expect(result).toBeUndefined();

    // input is defined but does not have an ID
    resource = { foo: 'bar'};
    result = jobMapper.mapColigoJobRunToUIJobRun(resource);
    expect(result).toBeUndefined();
  });

  it('returns an IUIJobRun if all criteria are matching', () => {
    // input is defined
    const resource = {
      kind: 'JobRun',
      metadata: {
        name: 'some-sample',
      },
      spec: {},
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: commonJobModel.IUIJobRun = jobMapper.mapColigoJobRunToUIJobRun(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.name).toEqual('some-sample');
    expect(result.regionId).toEqual(regionId);
    expect(result.projectId).toEqual(projectId);

    expect(result.status).toEqual(commonJobModel.UIJobStatus.WAITING);
  });

  it('wont fail if NO //spec/jobDefinitionSpec/spec/containers[]/container is set', () => {
    // input is defined
    const resource = {
      kind: 'JobRun',
      metadata: {
        name: 'some-sample',
      },
      spec: {
        jobDefinitionSpec: {
          containers: {},
        },
      },
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: commonJobModel.IUIJobRun = jobMapper.mapColigoJobRunToUIJobRun(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.spec).toBeUndefined();
  });

  it('converts a real-life jobrun resource', () => {
    // read the jobrun from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/get-jobrun_response-ok.json', 'utf8'));

    const result: commonJobModel.IUIJobRun = jobMapper.mapColigoJobRunToUIJobRun(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('some-new-job-pjw4v-jobrun-wd7mg');

    expect(result.status).toEqual(commonJobModel.UIJobStatus.SUCCEEDED);

    // check the spec
    expect(result.spec).toBeDefined();
    expect(result.spec.cpus).toEqual(1);
    expect(result.spec.memory).toEqual(536870912 * 2); // 1 Gi
    expect(result.spec.image).toEqual('busybox');
  });

  it('converts a real-life jobdefinition resource', () => {
    // read the jobdef from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/get-jobdef_response-ok.json', 'utf8'));

    const result: commonJobModel.IUIJobDefinition = jobMapper.mapColigoJobDefinitionToUIJobDefinition(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('some-new-job-pjw4v');
    expect(result.kind).toEqual('JobDefinition');
    expect(result.spec.cpus).toEqual(1);
    expect(result.spec.memory).toEqual(536870912 * 2);
    expect(result.spec.image).toEqual('busybox');
    expect(result.spec.command).toEqual(['/bin/sh', '-c', 'date; echo Hello $JOB_INDEX']);
    expect(result.spec.args).toEqual(['some-arg']);
    expect(result.spec.env).toBeDefined();
    expect((result.spec.env[0] as IUIEnvItemLiteral).name).toEqual('foo');
    expect((result.spec.env[0] as IUIEnvItemLiteral).value).toEqual('bar');
    expect(result.created).toEqual(1586271643000);
  });

  it('converts an UI jobdefinition to a jodef resource', () => {
    let jobDef: commonJobModel.IUIJobDefinition = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.JOBDEFINITION,
      name: 'foo',
      regionId: 'us-south',
      spec: {
        image: 'some-image',
        imagePullSecret: 'some-secret',
      },
    };

    let result: jobModel.IJobDefinition = jobMapper.mapUIJobDefinitionToColigoJobDefinition(jobDef);
    expect(result).toBeDefined();
    expect(result.kind).toEqual('JobDefinition');
    expect(result.metadata).toBeDefined();
    expect(result.metadata.name).toEqual(jobDef.name);
    expect(result.metadata.namespace).toBeUndefined();

    expect(result.spec).toBeDefined();
    expect(result.spec.containers[0].image).toEqual('some-image');

    jobDef = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.JOBDEFINITION,
      name: 'foo',
      regionId: 'us-south',
      spec: {
        cpus: 0.1,
        image: 'ibmcom/kn-helloworld',
        imagePullSecret: 'some-secret',
        memory: 2345678,
      }
    };

    result = jobMapper.mapUIJobDefinitionToColigoJobDefinition(jobDef);
    expect(result).toBeDefined();
    expect(result.kind).toEqual('JobDefinition');
    expect(result.metadata).toBeDefined();
    expect(result.metadata.name).toEqual(jobDef.name);
    expect(result.metadata.namespace).toBeUndefined();

    expect(result.spec).toBeDefined();
    expect(result.spec.containers).toBeDefined();
    expect(result.spec.containers[0]).toBeDefined();
    expect(result.spec.containers[0].image).toEqual('ibmcom/kn-helloworld');
    expect(result.spec.containers[0].resources).toBeDefined();
    expect(result.spec.containers[0].resources.requests).toBeDefined();
    expect(result.spec.containers[0].resources.requests.cpu).toEqual('0.1');
    expect(result.spec.containers[0].resources.requests.memory).toEqual('2Mi');
    expect(result.spec.imagePullSecrets).toBeDefined();
    expect(result.spec.imagePullSecrets[0].name).toEqual('some-secret');
  });

});

describe('countInstances', () => {
    let jobMapper: any;

    beforeEach(() => {
        jobMapper = proxyquire('../../../ts/mapper/job-mapper', {
        });
    });

    it('returns the correct number of instances based on arrayspec', ()=> {
        expect(jobMapper.countInstances("1")).toEqual(1);
        expect(jobMapper.countInstances("1,3")).toEqual(2);
        expect(jobMapper.countInstances("1-3")).toEqual(3);
        expect(jobMapper.countInstances("1,2,3-6")).toEqual(6);
        expect(jobMapper.countInstances("1-2,3,5-7")).toEqual(6);
        expect(jobMapper.countInstances(undefined)).toEqual(undefined);
    })
});