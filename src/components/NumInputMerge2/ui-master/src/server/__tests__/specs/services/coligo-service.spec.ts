import * as fs from 'fs';
import { IAccessDetails } from './../../../ts/model/access-details-model';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import * as nconf from '../../mocks/lib/nconf';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error = undefined;
    let response;
    let body;

    if (options.headers.Authorization.indexOf('something-stupid') > -1) {
      response = {
        statusCode: 400
      };
      body = '';
    } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
      response = {
        statusCode: 200
      };
      body = 'this is a string not a JSON object';
    } else if (options.method === 'GET' && options.path === '/api/v1/namespaces/dc06f663-8837-4c6d-8455-959f9193e59c/config') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 404
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-namespace-config_404.json', 'utf8');
      } else {
        // get namespace config
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-namespace-config_ok.json', 'utf8');
      }
    } else if (options.method === 'GET' && options.path === '/api/v1/tenant/dc06f663-8837-4c6d-8455-959f9193e59c/status') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-tenant-status-failed_401.json', 'utf8');
      } else {
        // get tenant status
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-tenant-status-ok_ready.json', 'utf8');
      }
    } else if (options.method === 'GET' && options.path === '/api/v1/project/dc06f663-8837-4c6d-8455-959f9193e59c/info') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-project-info-failed_401.json', 'utf8');
      } else if (options.headers.Authorization.indexOf('something-without-expire') > -1) {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-project-info-ok_ready.json', 'utf8');
      } else {
        // get project information
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/coligo-service/get-project-info-ok_expire.json', 'utf8');
      }
    }

    callbackFn(error, response, body);
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

const iamServiceMock = {
  getBxIAMTokens: (req: any) => {
    return Promise.resolve({
      access_token: 'some-valid-bx-clientid-access-token',
      refresh_token: 'some-valid-bx-clientid-refresh-token',
    });
  },
  getIAMAccessToken: (req: any) => {
    return req && req.user && req.user.iam_token;
  },
};

describe('coligoService', () => {
  let coligoService;

  const OLD_ENV = process.env;

  beforeEach(() => {

    process.env.coligoEnvironments = '{ "us-south": "api.us-south.knative.test.cloud.ibm.com" }';

    coligoService = proxyquire('../../../ts/services/coligo-service', {
      '../utils/logger-utils': loggerUtil,
      '../utils/monitoring-utils': monitoringUtilsMock,
      './ic-iam-service': iamServiceMock,
      '@console/console-platform-nconf': nconf,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('getNamespaceConfig() retrieves the config of the given namespace', () => {

    const ctx = {
      tid: '123',
    };
    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    const accessToken = 'something-valid';
    coligoService.getNamespaceConfig(ctx, clusterId, namespaceId, accessToken).then((kubeConfig) => {
      expect(kubeConfig).toBeDefined();
      expect(kubeConfig.apiVersion).toEqual('v1');
    }).catch((e) => {
      fail(e);
    });

  });

  it('retrieveNamespaceAccessDetails() retrieves the access details of a valid namespace', () => {

    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    const req = {
      user: {
        iam_id: 'user-id',
        token: 'something-valid',
      }
    };
    coligoService.retrieveNamespaceAccessDetails(req, clusterId, namespaceId).then((namespaceAccessDetails: IAccessDetails) => {
      expect(namespaceAccessDetails).toBeDefined();
      expect(namespaceAccessDetails.guid).toEqual(namespaceId);
      expect(namespaceAccessDetails.name).toEqual('89e41770-c744');
      expect(namespaceAccessDetails.region).toEqual(clusterId);
    }).catch((e) => {
      fail(e);
    });
  });

  it('getEndpointUrlOfCluster() will handle invalid input values', () => {

    const ctx = {
      tid: '123',
    };

    let kubeConfig;
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {};
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      foo: 'bar'
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      clusters: 'bar'
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      clusters: []
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      clusters: [{
        foo: 'bar',
      }]
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      clusters: [{
        cluster: 'bar',
      }]
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      clusters: [{
        cluster: {},
      }]
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toBeNull();

  });

  it('getEndpointUrlOfCluster() extracts the endpoint URL', () => {
    const ctx = {
      tid: '123',
    };
    const kubeConfig = {
      clusters: [{
        cluster: {
          server: 'some-value'
        },
      }]
    };
    expect(coligoService.getEndpointUrlOfCluster(ctx, kubeConfig)).toEqual('some-value');
  });

  it('getAccessTokenOfNamespace() will handle invalid input values', () => {
    const ctx = {
      tid: '123',
    };

    let kubeConfig;
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {};
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      foo: 'bar'
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      users: 'bar'
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      users: []
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      users: [{
        name: 'bar',
      }]
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      users: [{
        name: 'bar',
        user: 'foo'
      }]
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      users: [{
        name: 'bar',
        user: {}
      }]
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();

    kubeConfig = {
      users: [{
        name: 'bar',
        user: {
          token: null
        }
      }]
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toBeNull();
  });

  it('getAccessTokenOfNamespace() extracts the access token', () => {
    const ctx = {
      tid: '123',
    };
    const kubeConfig = {
      users: [{
        name: 'bar',
        user: {
          'auth-provider': {
            config: {
              'id-token': 'some-value'
            }
          }
        }
      }]
    };
    expect(coligoService.getAccessTokenOfNamespace(ctx, kubeConfig)).toEqual('some-value');
  });

  it('getTenantStatus() retrieves the status of the given tenant', () => {
    const ctx = {
      tid: '123',
      user: {
        iam_token: 'something-valid',
      }
    };
    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    coligoService.getTenantStatus(ctx, clusterId, namespaceId).then((tenantStatus) => {
      expect(tenantStatus).toBeDefined();
      expect(tenantStatus.Domainstatus).toEqual('Ready');
      expect(tenantStatus.Namespacestatus).toEqual('Ready');
    }).catch((e) => {
      fail(e);
    });

  });

  it('getTenantStatus() requires proper authentication', (done) => {
    const ctx = {
      tid: '123',
      user: {
        iam_token: 'something-forbidden',
      }
    };
    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    coligoService.getTenantStatus(ctx, clusterId, namespaceId).catch((err) => {
      expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetTenantStatusError', _code: 106001 }));
      done();
    }).catch((e) => {
      fail(e);
    });

  });

  it('getProjectInfo() retrieves the information of the given project', () => {
    const ctx = {
      tid: '123',
      user: {
        iam_token: 'something-valid',
      }
    };
    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    coligoService.getProjectInfo(ctx, clusterId, namespaceId).then((projectInfo) => {
      expect(projectInfo).toBeDefined();
      expect(projectInfo.Domainstatus).toEqual('Ready');
      expect(projectInfo.Namespacestatus).toEqual('Ready');
      expect(projectInfo.ExpireTimestamp).toEqual(1591209186553);
    }).catch((e) => {
      fail(e);
    });

  });

  it('getProjectInfo() retrieves the information of the given project - the project does not have a expire timestamp', () => {
    const ctx = {
      tid: '123',
      user: {
        iam_token: 'something-without-expire',
      }
    };
    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    coligoService.getProjectInfo(ctx, clusterId, namespaceId).then((projectInfo) => {
      expect(projectInfo).toBeDefined();
      expect(projectInfo.Domainstatus).toEqual('Ready');
      expect(projectInfo.Namespacestatus).toEqual('Ready');
      expect(projectInfo.ExpireTimestamp).toBeUndefined();
    }).catch((e) => {
      fail(e);
    });

  });

  it('getProjectInfo() requires proper authentication', (done) => {
    const ctx = {
      tid: '123',
      user: {
        iam_token: 'something-forbidden',
      }
    };
    const clusterId = 'us-south';
    const namespaceId = 'dc06f663-8837-4c6d-8455-959f9193e59c';
    coligoService.getProjectInfo(ctx, clusterId, namespaceId).catch((err) => {
      expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetProjectInfoError', _code: 106003 }));
      done();
    }).catch((e) => {
      fail(e);
    });

  });
});
