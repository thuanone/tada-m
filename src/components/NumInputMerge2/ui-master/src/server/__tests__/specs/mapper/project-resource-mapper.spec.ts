import * as fs from 'fs';
import * as resourceModel from '../../../ts/model/project-resource-model';
import * as commonModel from './../../../../common/model/common-model';
import * as projectModel from './../../../../common/model/project-model';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';

describe('project resource mapper', () => {
  let projectResourceMapper: any;

  beforeEach(() => {
    projectResourceMapper = proxyquire('../../../ts/mapper/project-resource-mapper', {
      '@console/console-platform-log4js-utils': loggerUtil,
    });
  });

  it('returns null if the given input is invalid', () => {
    // input is undefined
    let resource: any;
    let result = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeUndefined();

    // input is empty
    resource = {};
    result = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeUndefined();

    // input is a string
    resource = 'string';
    result = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeUndefined();

    // input is defined but does not have an ID
    resource = { foo: 'bar'};
    result = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeUndefined();
  });

  it('returns a project if all criteria are matching', () => {
    // input is defined
    const resource = {
      account_id: '7658687ea07db8396963ebe2b8e1897d',
      created_at: '',
      id: 'crn:v1:bluemix:public:functions:us-south:a/7658687ea07db8396963ebe2b8e1897d:0ca4b9a5-c9e8-4d1d-953b-3ffc3f1bd178::',
      name: 'some-name',
      region_id: 'us-south',
      updated_at: '',
    };
    const result: resourceModel.IProjectResource = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeDefined();
    expect(result.guid).toEqual('0ca4b9a5-c9e8-4d1d-953b-3ffc3f1bd178');
    expect(result.crn).toEqual(resource.id);
    expect(result.region).toEqual(resource.region_id);
    expect(result.name).toEqual(resource.name);
  });

  it('parses a project resource', () => {
    // input is defined
    const resource = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_resource-ok.json', 'utf8'));
    const result: resourceModel.IProjectResource = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeDefined();
    expect(result.guid).toEqual('6089c5a1-a3a2-4d2f-bdff-d3c60af2f1ed');
    expect(result.crn).toEqual(resource.id);
    expect(result.region).toEqual(resource.region_id);
    expect(result.name).toEqual(resource.name);
    expect(result.resource_group_id).toEqual(resource.resource_group_id);
  });

  it('parses a resource controller error', () => {
    // input is defined and is provided as JSON object
    let resource = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_resource-failed-401.json', 'utf8'));
    let result: resourceModel.IResourceControllerErrorResponse = projectResourceMapper.parseResourceControllerError(resource);
    expect(result).toBeDefined();
    expect(result.transaction_id).toEqual('bss-b454461a71ee474d');
    expect(result.message).toEqual('Token is expired');
    expect(result.error_code).toEqual('RC-IamErrorResponse');
    expect(result.status_code).toEqual(401);

    // input is defined and is provided as string
    resource = fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_resource-failed-401.json', 'utf8');
    result = projectResourceMapper.parseResourceControllerError(resource);
    expect(result).toBeDefined();
    expect(result.transaction_id).toEqual('bss-b454461a71ee474d');
    expect(result.message).toEqual('Token is expired');
    expect(result.error_code).toEqual('RC-IamErrorResponse');
    expect(result.status_code).toEqual(401);

    // input is defined and is provided as string
    // 502 gateway error
    resource = fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_resource-failed-502.html', 'utf8');
    result = projectResourceMapper.parseResourceControllerError(resource);
    expect(result).toBeDefined();
    expect(result.transaction_id).toBeUndefined();
    expect(result.message).toEqual('502 Bad Gateway');
    expect(result.details).toEqual('<html><head><title>502 Bad Gateway</title></head></html>');
    expect(result.error_code).toBeUndefined();
    expect(result.status_code).toBeUndefined();
  });

  it('refuses to parse an invalid resource controller error', () => {
    // input is defined, but wrong
    const resource = { foo: 'bar'};
    const result: resourceModel.IResourceControllerErrorResponse | any = projectResourceMapper.parseResourceControllerError(resource);
    expect(result).toBeDefined();
    expect(result.foo).toEqual(resource.foo);
  });

  it('converts a project resource to a UI project', () => {
    // input is defined
    const resource: resourceModel.IProjectResource = {
      created: Date.parse('2019-12-08T21:54:06.254Z'),
      crn: 'some-crn',
      guid: 'some-guid',
      name: 'some-name',
      region: 'some-region',
      resource_group_id: 'some-resource-group',
      resource_plan_id: 'some-resource-plan',
      state: 'active',
    };
    const result: projectModel.IUIProject = projectResourceMapper.resourceToProject(resource);
    expect(result).toBeDefined();
    expect(result.id).toEqual(resource.guid);
    expect(result.crn).toEqual(resource.crn);
    expect(result.region).toEqual(resource.region);
    expect(result.name).toEqual(resource.name);
    expect(result.resourceGroupId).toEqual(resource.resource_group_id);
    expect(result.resourcePlanId).toEqual(resource.resource_plan_id);
    expect(result.created).toEqual(resource.created);
    expect(result.state).toEqual(projectModel.UIResourceInstanceStatus.ACTIVE);
  });

  it('refused to convert an invalid project resource to a UI project', () => {
    // input is not defined
    let resource;
    let result: projectModel.IUIProject = projectResourceMapper.resourceToProject(resource);
    expect(result).toBeUndefined();

    // input is empty
    resource = {};
    result = projectResourceMapper.resourceToProject(resource);
    expect(result).toBeDefined();
  });

  it('converts a UI project to a project resource', () => {
    // input is defined
    const project: projectModel.IUIProject = {
      created: Date.parse('2019-12-08T21:54:06.254Z'),
      crn: 'some-crn',
      id: 'some-guid',
      kind: commonModel.UIEntityKinds.PROJECT,
      name: 'some-name',
      region: 'some-region',
      resourceGroupId: 'some-resource-group',
      resourcePlanId: 'some-resource-plan',
    };
    const result: resourceModel.IProjectResource = projectResourceMapper.projectToResourceInstance(project);
    expect(result).toBeDefined();
    expect(result.guid).toEqual(project.id);
    expect(result.crn).toEqual(project.crn);
    expect(result.region).toEqual(project.region);
    expect(result.name).toEqual(project.name);
    expect(result.resource_group_id).toEqual(project.resourceGroupId);
    expect(result.resource_plan_id).toEqual(project.resourcePlanId);
    expect(result.created).toEqual(project.created);
  });

  it('refused to convert an invalid UI project to a project resource', () => {
    // input is not defined
    let project;
    let result: resourceModel.IProjectResource = projectResourceMapper.projectToResourceInstance(project);
    expect(result).toBeUndefined();

    // input is empty
    project = {};
    result = projectResourceMapper.projectToResourceInstance(project);
    expect(result).toBeDefined();
  });

  it('parses a just created project resource', () => {
    // input is defined
    const resource = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/created-resource_controller_resource-ok.json', 'utf8'));
    const result: resourceModel.IProjectResource = projectResourceMapper.resourceControllerResourceToProject(resource);
    expect(result).toBeDefined();
    expect(result.guid).toEqual('be97998b-fd6d-4533-bbb6-6848079127c5');
    expect(result.crn).toEqual(resource.id);
    expect(result.region).toEqual(resource.region_id);
    expect(result.name).toEqual(resource.name);
    expect(result.resource_group_id).toEqual(resource.resource_group_id);

    // convert that resource to a project
    const project: projectModel.IUIProject = projectResourceMapper.resourceToProject(result);
    expect(project).toBeDefined();
    expect(project.id).toEqual('be97998b-fd6d-4533-bbb6-6848079127c5');
    expect(project.crn).toEqual(resource.id);
    expect(project.region).toEqual(resource.region_id);
    expect(project.name).toEqual(resource.name);
    expect(project.state).toEqual(projectModel.UIResourceInstanceStatus.PROVISIONING);
  });

  it('refuses to parse an invalid resource group', () => {
    let resource;
    let result: resourceModel.IResourceGroup = projectResourceMapper.resourceControllerResourceToResourceGroup(resource);
    expect(result).toBeUndefined();

    resource = {};
    result = projectResourceMapper.resourceControllerResourceToResourceGroup(resource);
    expect(result).toBeDefined();
  });

  it('parses a resource group', () => {
    const resource = {
      crn: 'some-crn',
      default: true,
      id: 'some-id',
      name: 'some-name',
      state: 'active',
    };

    const result: resourceModel.IResourceGroup = projectResourceMapper.resourceControllerResourceToResourceGroup(resource);
    expect(result).toBeDefined();
    expect(result.id).toEqual(resource.id);
    expect(result.crn).toEqual(resource.crn);
    expect(result.default).toEqual(resource.default);
    expect(result.name).toEqual(resource.name);
    expect(result.state).toEqual(resource.state);
  });

  it('parses a projectInfo', () => {
    const resource: resourceModel.IProjectInfo = {
      Domainstatus: 'Ready',
      Expiry: 1591209186,
      Namespacestatus: 'Ready',
    };

    const result: projectModel.IUIProjectStatus = projectResourceMapper.projectInfoToProjectStatus(resource);
    expect(result).toBeDefined();
    expect(result.domain).toEqual(true);
    expect(result.tenant).toEqual(true);
    expect(result.expireTimestamp).toEqual(1591209186000);
  });

});
