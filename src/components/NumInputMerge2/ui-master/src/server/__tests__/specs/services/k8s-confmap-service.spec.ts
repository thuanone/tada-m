import * as fs from 'fs';

// regular imports
import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as k8sModel from '../../../ts/model/k8s-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error = undefined;
    let response;
    let body;

    // listConfigMaps
    if (options.method === 'GET' && options.path.indexOf('/configmaps') > -1) {
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
      } else if (options.headers.Authorization.indexOf('something-empty') > -1) {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-confmaps-empty.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-confmaps-ok.json', 'utf8');
      }
    }

    // getConfigMap
    if (options.method === 'GET' && options.path.indexOf('/configmaps/') > -1) {
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
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-confmap-ok.json', 'utf8');
      }
    }

    // createConfigMap
    if (options.method === 'POST' && options.path.indexOf('/configmaps') > -1) {
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
      } else if (options.headers.Authorization.indexOf('something-exists') > -1) {
        response = {
          statusCode: 409
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/create-confmap-failed_alreadyexists.json', 'utf8'));
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/create-confmap-ok.json', 'utf8'));
      }
    }

    // deleteConfigMap
    if (options.method === 'DELETE' && options.path.indexOf('/configmaps/') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 404
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/delete-confmap-failed.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/delete-confmap-ok.json', 'utf8');
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

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'foo',
    user: {}
  } as commonModel.IUIRequestContext;
}

describe('getConfigMapsOfNamespace()', () => {
  let k8sConfigMapsService;

  beforeEach(() => {
    k8sConfigMapsService = proxyquire('../../../ts/services/k8s-confmap-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
        }),
        '../utils/logger-utils': loggerUtilMock,
        '../utils/monitoring-utils': monitoringUtilsMock,
        '@console/console-platform-resiliency': resiliencyMock,
      }),
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };

    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMapsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e.message).toEqual('accessDetails.name must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'project-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMapsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetConfigMapsError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', (done) => {
    const accessDetails = {
      accessToken: 'something-broken',
      name: 'project-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMapsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e).toBeDefined();
      expect(e.name).toEqual('FailedToGetConfigMapsError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a list of confmaps', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMapsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).then((list) => {
      const result = list.items;
      expect(result).toBeDefined();
      expect(result.length).toEqual(1);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toMatch('some-confmap');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getKubeConfigMap()', () => {
  let k8sConfigMapsService;

  beforeEach(() => {
    k8sConfigMapsService = proxyquire('../../../ts/services/k8s-confmap-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
        }),
        '../utils/logger-utils': loggerUtilMock,
        '../utils/monitoring-utils': monitoringUtilsMock,
        '@console/console-platform-resiliency': resiliencyMock,
      }),
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };

    const confmapName: string = undefined;
    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMap(getRequestContextMock, accessDetails, confmapName, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and resourceName must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', (done) => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const confmapName = 'foo';
    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMap(getRequestContextMock, accessDetails, confmapName, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetConfigMapError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', (done) => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const confmapName = 'foo';
    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMap(getRequestContextMock, accessDetails, confmapName, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetConfigMapError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a confmap', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const confmapName = 'foo';
    const labelSelector: string = undefined;

    k8sConfigMapsService.getKubeConfigMap(getRequestContextMock, accessDetails, confmapName, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('ConfigMap');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('some-confmap');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('createKubeConfigMap()', () => {
  let k8sConfigMapsService;

  beforeEach(() => {
    k8sConfigMapsService = proxyquire('../../../ts/services/k8s-confmap-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
        }),
        '../utils/logger-utils': loggerUtilMock,
        '../utils/monitoring-utils': monitoringUtilsMock,
        '@console/console-platform-resiliency': resiliencyMock,
      }),
    });
  });

  it('no input results in rejection', (done) => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    let confmap: k8sModel.IKubernetesConfigMap;

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and confMapToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    confmap = undefined;

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and confMapToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    confmap = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'ConfigMap',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
    };

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and confMapToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    confmap = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'ConfigMap',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
    };

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and confMapToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', (done) => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const confmap: k8sModel.IKubernetesConfigMap = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'ConfigMap',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
    };

    // it is expected that the HTTP call returns an error (see mock -> accessToken=>something-sutpid)
    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateConfigMapError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', (done) => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const confmap: k8sModel.IKubernetesConfigMap = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'ConfigMap',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
    };

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).catch((e) => {
      expect(e).toBeDefined();
      expect(e).toEqual(jasmine.objectContaining({ name: 'FailedToCreateConfigMapError', _code: 108003 }));
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails because confmap with same name exists', (done) => {

    const accessDetails = {
      accessToken: 'something-exists',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const confmap: k8sModel.IKubernetesConfigMap = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'ConfigMap',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
    };

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateConfigMapBecauseAlreadyExistsError', _code: 108004 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('created a confmap resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const confmap: k8sModel.IKubernetesConfigMap = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'ConfigMap',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
    };

    k8sConfigMapsService.createKubeConfigMap(getRequestContextMock(), accessDetails, confmap).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('ConfigMap');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('deleteKubeConfigMap()', () => {
  let k8sConfigMapsService;

  beforeEach(() => {
    k8sConfigMapsService = proxyquire('../../../ts/services/k8s-confmap-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
        }),
        '../utils/logger-utils': loggerUtilMock,
        '../utils/monitoring-utils': monitoringUtilsMock,
        '@console/console-platform-resiliency': resiliencyMock,
      }),
    });
  });

  it('deleted a confmap resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const confmapId: string = 'foo';

    k8sConfigMapsService.deleteKubeConfigMap(getRequestContextMock(), accessDetails, confmapId).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Status');
      expect(result.status).toEqual('Success');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('failes deleting a confmap resource', (done) => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const confmapId: string = 'foo';

    k8sConfigMapsService.deleteKubeConfigMap(getRequestContextMock(), accessDetails, confmapId).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToDeleteConfigMapError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });
});
