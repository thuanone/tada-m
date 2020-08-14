import * as fs from 'fs';
import * as appModel from '../../../../common/model/application-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';

describe('k8s mapper', () => {
  let k8sMapper: any;

  beforeEach(() => {
    k8sMapper = proxyquire('../../../ts/mapper/k8s-mapper', {
      '@console/console-platform-log4js-utils': loggerUtil,
    });
  });

  it('refuses to convert an invalid kubernetes pod resource to application instance', () => {
    // input is undefined
    let resource: any;
    let result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeNull();

    // input is empty
    resource = {};
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeNull();

    // input is a string
    resource = 'string';
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeNull();

    // input is defined but does not have a //metadata/name property
    resource = { foo: 'bar'};
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeNull();

    // input is defined but does not have a //metadata/name property
    resource = { metadata: 'bar'};
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeNull();

    // input is defined but does not have a //metadata/name property
    resource = { metadata: { foo: 'bar'} };
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeNull();
  });

  it('converts a valid kubernetes pod resource to application instance', () => {
    // input is defined but only has a name
    const resource = { metadata: { name: 'bar'} };
    const result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeDefined();
    expect(result.id).toEqual('bar');
    expect(result.name).toEqual('bar');
    expect(result.application).toBeUndefined();
    expect(result.revision).toBeUndefined();
    expect(result.created).toBeUndefined();
  });

  it('handles creation timestamps properly', () => {
    // input is defined but only has a name
    let resource = { metadata: { name: 'bar', creationTimestamp: '2020-FOOOT13:28:17Z'} };
    let result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeDefined();
    expect(result.created).toEqual(NaN);

    resource = { metadata: { name: 'bar', creationTimestamp: '123456789876'} };
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeDefined();
    expect(result.created).toEqual(NaN);

    resource = { metadata: { name: 'bar', creationTimestamp: '2020-03-19T13:28:17Z'} };
    result = k8sMapper.podToAppInstance(resource);
    expect(result).toBeDefined();
    expect(result.created).toBeDefined();
    expect(result.created).toEqual(1584624497000);
  });

  it('refuses to convert invalid kubernetes pod resources to application instances', () => {
    // input is undefined
    let resource: any;
    let result = k8sMapper.podsToAppInstances(resource);
    expect(result).toBeNull();

    // input is empty
    resource = {};
    result = k8sMapper.podsToAppInstances(resource);
    expect(result).toBeNull();

    // input is a string
    resource = 'string';
    result = k8sMapper.podsToAppInstances(resource);
    expect(result).toBeNull();

    // input is defined but does not have an ID
    resource = { foo: 'bar'};
    result = k8sMapper.podsToAppInstances(resource);
    expect(result).toBeNull();
  });

  it('converts a valid kubernetes pod list to application instances', () => {
    // input is defined but only has a name
    const resource = [{ metadata: { name: 'bar'} }];
    const result = k8sMapper.podsToAppInstances(resource);
    expect(result).toBeDefined();
    expect(result.length).toEqual(1);
    expect(result[0].id).toEqual('bar');
    expect(result[0].name).toEqual('bar');
    expect(result[0].application).toBeUndefined();
    expect(result[0].revision).toBeUndefined();
    expect(result[0].created).toBeUndefined();
  });

  it('converts a set of kubernetes pod resources to application instances', () => {
    // read the knative revisions from file
    const resources: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-pods-of-service-ok.json', 'utf8'));

    const result: appModel.IUIApplicationInstance[] = k8sMapper.podsToAppInstances(resources.items);
    expect(result).toBeDefined();
    expect(result.length).toEqual(3);
    expect(result[0].id).toEqual('some-application-ae9dlq-33-deployment-6d555999bb-2zkdr');
    expect(result[0].name).toEqual('some-application-ae9dlq-33-deployment-6d555999bb-2zkdr');
    expect(result[0].application).toEqual('some-application');
    expect(result[0].revision).toEqual('some-application-ae9dlq-33');
    expect(result[0].created).toEqual(1584624497000);
  });
});
