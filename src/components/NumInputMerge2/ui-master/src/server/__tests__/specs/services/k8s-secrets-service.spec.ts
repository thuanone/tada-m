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

    // listSecrets
    if (options.method === 'GET' && options.path.indexOf('/secrets') > -1) {
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
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-secrets-empty.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-secrets-ok.json', 'utf8');
      }
    }

    // getSecret
    if (options.method === 'GET' && options.path.indexOf('/secrets/') > -1) {
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
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-secret_opaque-ok.json', 'utf8'));
      }
    }

    // createSecret
    if (options.method === 'POST' && options.path.indexOf('/secrets') > -1) {
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
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/create-secret-failed_alreadyexists.json', 'utf8'));
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/create-secret_opaque-ok.json', 'utf8'));
      }
    }

    // deleteSecret
    if (options.method === 'DELETE' && options.path.indexOf('/secrets/') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 404
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/delete-secret-failed.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s/delete-secret-ok.json', 'utf8');
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

describe('getSecretsOfNamespace()', () => {
  let k8sSecretsService;

  beforeEach(() => {
    k8sSecretsService = proxyquire('../../../ts/services/k8s-secrets-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
          './monitoring-utils': monitoringUtilsMock,
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

    k8sSecretsService.getKubeSecretsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e.message).toEqual('accessDetails.name must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', (done) => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'project-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sSecretsService.getKubeSecretsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetSecretsError');
      done();
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

    k8sSecretsService.getKubeSecretsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e).toBeDefined();
      expect(e).toEqual(jasmine.objectContaining({ name: 'FailedToGetSecretsError', _code: 107001 }));
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a list of secrets', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sSecretsService.getKubeSecretsOfNamespace(getRequestContextMock(), accessDetails, labelSelector).then((list) => {
      const result = list.items;
      expect(result).toBeDefined();
      expect(result.length).toEqual(1);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toMatch('some-secret');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getKubeSecret()', () => {
  let k8sSecretsService;

  beforeEach(() => {
    k8sSecretsService = proxyquire('../../../ts/services/k8s-secrets-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
          './monitoring-utils': monitoringUtilsMock,
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

    const secretName: string = undefined;
    const labelSelector: string = undefined;

    k8sSecretsService.getKubeSecret(getRequestContextMock, accessDetails, secretName, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and resourceName must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const secretName = 'foo';
    const labelSelector: string = undefined;

    k8sSecretsService.getKubeSecret(getRequestContextMock, accessDetails, secretName, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetSecretError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const secretName = 'foo';
    const labelSelector: string = undefined;

    k8sSecretsService.getKubeSecret(getRequestContextMock, accessDetails, secretName, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetSecretError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a secret', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const secretName = 'foo';
    const labelSelector: string = undefined;

    k8sSecretsService.getKubeSecret(getRequestContextMock, accessDetails, secretName, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Secret');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('some-secret');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('createKubeSecret()', () => {
  let k8sSecretsService;

  beforeEach(() => {
    k8sSecretsService = proxyquire('../../../ts/services/k8s-secrets-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
          './monitoring-utils': monitoringUtilsMock,
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
    let secret: k8sModel.IKubernetesSecret;

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and secretToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    secret = undefined;

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and secretToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    secret = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'Secret',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      type: 'Opaque',
    };

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and secretToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    secret = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'Secret',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      type: 'Opaque',
    };

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and secretToCreate must be set properly');
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
    const secret: k8sModel.IKubernetesSecret = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'Secret',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      type: 'Opaque',
    };

    // it is expected that the HTTP call returns an error (see mock -> accessToken=>something-sutpid)
    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateSecretError');
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
    const secret: k8sModel.IKubernetesSecret = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'Secret',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      type: 'Opaque',
    };

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).catch((e) => {
      expect(e).toBeDefined();
      expect(e).toEqual(jasmine.objectContaining({ name: 'FailedToCreateSecretError', _code: 107003 }));
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails because secret with same name exists', (done) => {

    const accessDetails = {
      accessToken: 'something-exists',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const secret: k8sModel.IKubernetesSecret = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'Secret',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      type: 'Opaque',
    };

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateSecretBecauseAlreadyExistsError', _code: 107004 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('created a secret resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const secret: k8sModel.IKubernetesSecret = {
      apiVersion: 'v1',
      data: {
        foo: 'bar',
      },
      kind: 'Secret',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      type: 'Opaque',
    };

    k8sSecretsService.createKubeSecret(getRequestContextMock(), accessDetails, secret).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Secret');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('deleteKubeSecret()', () => {
  let k8sSecretsService;

  beforeEach(() => {
    k8sSecretsService = proxyquire('../../../ts/services/k8s-secrets-service', {
      '../utils/logger-utils': loggerUtilMock,
      './common-k8s-service': proxyquire('../../../ts/services/common-k8s-service', {
        '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
          './logger-utils': loggerUtilMock,
          './monitoring-utils': monitoringUtilsMock,
        }),
        '../utils/logger-utils': loggerUtilMock,
        '../utils/monitoring-utils': monitoringUtilsMock,
        '@console/console-platform-resiliency': resiliencyMock,
      }),
    });
  });

  it('deleted a secret resource', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const secretId: string = 'foo';

    k8sSecretsService.deleteKubeSecret(getRequestContextMock(), accessDetails, secretId).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Status');
      expect(result.status).toEqual('Success');
    }).catch((e) => {
      fail(e);
    });
  });

  it('failes deleting a secret resource', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const secretId: string = 'foo';

    k8sSecretsService.deleteKubeSecret(getRequestContextMock(), accessDetails, secretId).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToDeleteSecretError');
    }).catch((e) => {
      fail(e);
    });
  });
});
