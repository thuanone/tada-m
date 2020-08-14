// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';

import * as projectModel from './../../../../common/model/project-model';

describe('coligo utils', () => {
  let coligoUtils;

  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = OLD_ENV;

    process.env.coligoEnvironments = '{ "us-south": "api.us-south.knative.test.cloud.ibm.com" }';

    coligoUtils = proxyquire('../../../ts/utils/coligo-utils', {
      '@console/console-platform-log4js-utils': loggerUtil,
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns false if the given clusterId is invalid', () => {
    // input is undefined
    let clusterId: string;
    let result = coligoUtils.isMultitenantRegion(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    // input is empty
    clusterId = '';
    result = coligoUtils.isMultitenantRegion(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    // input is empty
    clusterId = 'something-stupid';
    result = coligoUtils.isMultitenantRegion(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });

  it('returns true if the given clusterId is a known multi-tenant cluster', () => {
    // input is valid
    const clusterId = 'us-south';
    const result = coligoUtils.isMultitenantRegion(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('ensures that the cluster id check is case-insensitive', () => {
    // input is valid
    const clusterId = 'uS-sOuth';
    const result = coligoUtils.isMultitenantRegion(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('returns NULL if the given clusterId cannot be resolved, or the input is invalid', () => {
    // input is undefined
    let clusterId: string;
    let result = coligoUtils.getControlPlaneUrl(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeNull();

    // input is empty
    clusterId = '';
    result = coligoUtils.getControlPlaneUrl(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeNull();

    // input is empty
    clusterId = 'something-stupid';
    result = coligoUtils.getControlPlaneUrl(clusterId);
    expect(result).toBeDefined();
    expect(result).toBeNull();
  });

  it('returns the controlPlane URL if the given clusterId can be resolved', () => {
    // input is valid
    const clusterId = 'us-south';
    const result = coligoUtils.getControlPlaneUrl(clusterId);
    expect(result).toBeDefined();
    expect(result).toEqual('https://api.us-south.knative.test.cloud.ibm.com');
  });

  it('returns the controlPlane URL even if the given clusterId does not match the exact cases', () => {
    // input is valid
    const clusterId = 'Us-souTh';
    const result = coligoUtils.getControlPlaneUrl(clusterId);
    expect(result).toBeDefined();
    expect(result).toEqual('https://api.us-south.knative.test.cloud.ibm.com');
  });

  it('returns the regions', () => {
    const result: projectModel.IUIRegions = coligoUtils.getRegions();
    expect(result).toBeDefined();
    expect(result.length).toEqual(1);
    expect(result[0].id).toEqual('us-south');
  });

  it('returns an empty list of regions, if the backend configuration is empty', () => {

    process.env.coligoEnvironments = '';

    const result: projectModel.IUIRegions = coligoUtils.getRegions();
    expect(result).toBeDefined();
    expect(result.length).toEqual(0);
  });

  it('returns an empty list of regions, if the backend configuration is missing', () => {

    delete process.env.coligoEnvironments;

    const result: projectModel.IUIRegions = coligoUtils.getRegions();
    expect(result).toBeDefined();
    expect(result.length).toEqual(0);
  });

  it('returns an empty list of regions, if the configuration is invalid', () => {

    process.env.coligoEnvironments = '{ "us-south": "api.us-south.knative.test.cloud.ibm.com';

    const result: projectModel.IUIRegions = coligoUtils.getRegions();
    expect(result).toBeDefined();
    expect(result.length).toEqual(0);
  });
});
