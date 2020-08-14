
import * as fs from 'fs';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';

import * as projectResourceModel from '../../../ts/model/project-resource-model';
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as nconf from '../../mocks/lib/nconf';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error: any = undefined;
    let response;
    let body;

    response = {
      statusCode: 500,
    };

    //
    // get project resources
    if (options.method === 'GET' && options.path.startsWith('/v2/resource_instances')) {
      if (options.headers.Authorization.indexOf('something-invalid') > -1) {
        response = {
          statusCode: 500
        };
      } else if (options.headers.Authorization.indexOf('something-malformed') > -1) {
        response = {
          statusCode: 200
        };

        body = '{ "foo": "bar" }';
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_resources-ok.json', 'utf8');
      }
    }

    //
    // delete project resource
    if (options.method === 'DELETE' && options.path.startsWith('/v2/resource_instances')) {
      if (options.headers.Authorization.indexOf('something-invalid') > -1) {
        response = {
          statusCode: 500
        };
        body = '';
      } else {
        response = {
          statusCode: 200
        };
        body = '{}';
      }
    }

    //
    // create project resource
    if (options.method === 'POST' && options.path.startsWith('/v2/resource_instances')) {
      if (options.headers.Authorization.indexOf('something-invalid') > -1) {
        response = {
          statusCode: 500
        };
      } else if (options.headers.Authorization.indexOf('something-malformed') > -1) {
        response = {
          statusCode: 200
        };

        body = '{ "foo": "bar" }';
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/created-resource_controller_resource-ok.json', 'utf8'));
      }
    }

    //
    // get resource groups
    if (options.method === 'GET' && options.path.startsWith('/v2/resource_groups')) {
      if (options.headers.Authorization.indexOf('something-invalid') > -1) {
        response = {
          statusCode: 500
        };
      } else if (options.headers.Authorization.indexOf('something-malformed') > -1) {
        response = {
          statusCode: 200
        };
        body = '{ "foo": "bar" }';
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_groups-ok.json', 'utf8');
      }
    }

    //
    // get service status
    if (options.method === 'GET' && options.path.startsWith('/info')) {
      if (options.headers.Authorization.indexOf('something-invalid') > -1) {
        response = {
          statusCode: 500
        };
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.stringify(fs.readFileSync('src/server/__tests__/mocks/backends/resource-controller/get-resource_controller_info-ok.json', 'utf8'));
      }
    }

    callbackFn(error, response, body);
  }
};

const coligoUtilsMock = {
  isMultitenantRegion: (regionId: string) => {
    return true;
  }
};

const coligoServiceMock = {
  isNamespaceMultitenantEnabled: (ctx: any, region: string, guid: string) => {
    return {};
  }
};

const monitoringUtilsMock = {
  createPerfLogEntry: (...args) => {
    // relax and take it easy
  },
  storePerfMonitorEntry: (...args) => {
    // relax and take it easy
  }
};

describe('resourceControllerService', () => {
  let resourceControllerService;

  beforeEach(() => {

    resourceControllerService = proxyquire('../../../ts/services/resource-controller-service', {
      '../mapper/project-resource-mapper': proxyquire('../../../ts/mapper/project-resource-mapper', {
        '../utils/logger-utils': loggerUtilMock,
      }),
      '../utils/coligo-utils': coligoUtilsMock,
      '../utils/logger-utils': loggerUtilMock,
      '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
        './logger-utils': loggerUtilMock,
        './monitoring-utils': monitoringUtilsMock,
        '@console/console-platform-resiliency': resiliencyMock,
      }),
      'nconf': nconf,
    });
  });

  it('Retrieve project resource (getProjectResource)', () => {
    const projectId = '6089c5a1-a3a2-4d2f-bdff-d3c60af2f1ed';
    const regionId = 'eu-gb';
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        iam_token: 'foo',
        refreshToken: 'bar'
      }
    };
    return resourceControllerService.getProjectResource(ctx, projectId, regionId).then((project: projectResourceModel.IProjectResource) => {
      expect(project).toBeDefined();
      expect(project.guid).toEqual('6089c5a1-a3a2-4d2f-bdff-d3c60af2f1ed');
      expect(project.name).toEqual('Namespace-o4Gttzshjgdj asgd ahsgdhj agsdhja');
      expect(project.region).toEqual('eu-gb');
    }).catch((e) =>
      fail(e)
    );
  });

  it('Failed to retrieve a project resource that does not exist (getProjectResource)', () => {
    const projectId = 'something-wrong';
    const regionId = 'all';
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        iam_token: 'foo',
        refreshToken: 'bar'
      }
    };
    return resourceControllerService.getProjectResource(ctx, projectId, regionId)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetProjectError', _code: 103002 }));
      }).catch((e) => {
        fail(e);
      });
  });

  it('throw exception if backend call succeeded but returned a malformed response (getProjectResource)', () => {
    const projectId = 'something-wrong';
    const regionId = 'all';
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        iam_token: 'something-malformed',
        refreshToken: 'bar'
      }
    };
    return resourceControllerService.getProjectResource(ctx, projectId, regionId)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToAccessResourceControllerDueWrongResponseFormatError', _code: 103010 }));
      }).catch((e) => {
        fail(e);
      });
  });

  it('create project resource (createProjectResource)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'foo'
      }
    };

    const resourceToCreate: projectResourceModel.IProjectResource = {
      created: Date.now(),
      guid: 'some-guid',
      name: 'some-project',
      region: 'some-region',
      resource_group_id: 'some-resource-group',
      resource_plan_id: 'some-resource-plan',
    };

    return resourceControllerService.createProjectResource(ctx, resourceToCreate)
      .then((project: projectResourceModel.IProjectResource) => {
        expect(project).toBeDefined();
        expect(project.name).toEqual('another-project');
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('should throw an error in case the backend call succeeded but returned something wrong (createProjectResource)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'something-malformed',
      }
    };

    const resourceToCreate: projectResourceModel.IProjectResource = {
      created: Date.now(),
      guid: 'some-guid',
      name: 'some-project',
      region: 'some-region',
      resource_group_id: 'some-resource-group',
      resource_plan_id: 'some-resource-plan',
    };

    return resourceControllerService.createProjectResource(ctx, resourceToCreate)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToAccessResourceControllerDueWrongResponseFormatError', _code: 103010 }));
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('should throw an error in case the backend call failed (createProjectResource)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'something-invalid',
      }
    };

    const resourceToCreate: projectResourceModel.IProjectResource = {
      created: Date.now(),
      guid: 'some-guid',
      name: 'some-project',
      region: 'some-region',
      resource_group_id: 'some-resource-group',
      resource_plan_id: 'some-resource-plan',
    };

    return resourceControllerService.createProjectResource(ctx, resourceToCreate)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateProjectError', _code: 103015 }));
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('delete project resource (deleteProjectResource)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'foo'
      }
    };

    const projectId: string = 'foo';

    return resourceControllerService.deleteProjectResource(ctx, projectId)
      .then((result) => {
        expect(result).toBeDefined();
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('deletion fails if  project id is not set (deleteProjectResource)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
      }
    };

    const projectId = undefined;

    return resourceControllerService.deleteProjectResource(ctx, projectId)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToDeleteProjectError', _code: 103016 }));
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('should throw an error in case the backend call failed (deleteProjectResource)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'something-invalid',
      }
    };

    const projectId: string = 'foo';

    return resourceControllerService.deleteProjectResource(ctx, projectId)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToDeleteProjectError', _code: 103016 }));
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('Retrieve resource groups (getResourceGroups)', () => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'foo',
      }
    };
    return resourceControllerService.getResourceGroups(ctx)
      .then((resourceGroups: projectResourceModel.IResourceGroup[]) => {
        expect(resourceGroups).toBeDefined();
        expect(resourceGroups.length).toEqual(1);
        expect(resourceGroups[0].name).toEqual('default');
        expect(resourceGroups[0].id).toEqual('4674987f404c4fbea63c3d78f7314c98');
        expect(resourceGroups[0].state).toEqual('ACTIVE');
      })
      .catch((e) =>
        fail(e)
      );
  });

  it('should throw an error in case the backend call failed (getResourceGroups)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'something-invalid',
      }
    };
    return resourceControllerService.getResourceGroups(ctx)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetResourceGroupsError', _code: 103012 }));
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('should throw an error in case the backend returns malformed responses (getResourceGroups)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'something-malformed',
      }
    };
    return resourceControllerService.getResourceGroups(ctx)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToAccessResourceControllerDueWrongResponseFormatError', _code: 103010 }));
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });

  it('retrieves the status of the service (getServiceStatus)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'foo'
      }
    };
    return resourceControllerService.getServiceStatus(ctx).then((serviceStatus: commonModel.IUIServiceStatus) => {
      expect(serviceStatus).toBeDefined();
      expect(serviceStatus.status).toEqual('OK');
      expect(serviceStatus.id).toEqual('resource-controller');
      done();
    }).catch((e) =>
      done.fail(e)
    );
  });

  it('set the status to failed, of the service does not respond properly (getServiceStatus)', (done) => {
    const ctx: commonModel.IUIRequestContext = {
      startTime: Date.now(),
      tid: 'foo',
      user: {
        bss_account: 'foobar',
        iam_token: 'something-invalid',
      }
    };
    return resourceControllerService.getServiceStatus(ctx)
      .then((serviceStatus: commonModel.IUIServiceStatus) => {
        expect(serviceStatus).toBeDefined();
        expect(serviceStatus.status).toEqual('FAILED');
        expect(serviceStatus.id).toEqual('resource-controller');
        done();
      })
      .catch((e) =>
        done.fail(e)
      );
  });
});
