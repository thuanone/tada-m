import * as fs from 'fs';

// regular imports
import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as buildModel from '../../../ts/model/build-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error = undefined;
    let response;
    let body;

    // listBuilds
    if (options.method === 'GET' && options.path.indexOf('/builds') > -1) {
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
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/list-builds-empty.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/list-builds-ok.json', 'utf8');
      }
    }

    // getBuild
    if (options.method === 'GET' && options.path.indexOf('/builds/') > -1) {
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
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/get-build-ok.json', 'utf8'));
      }
    }

    // createBuild
    if (options.method === 'POST' && options.path.indexOf('/builds') > -1) {
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
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/create-build-failed_already-exists.json', 'utf8'));
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/create-build-ok.json', 'utf8'));
      }
    }

    // updateBuild
    if (options.method === 'PATCH' && options.path.indexOf('/builds/') > -1) {
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
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/update-build-ok.json', 'utf8'));
      }
    }

    // deleteBuild
    if (options.method === 'DELETE' && options.path.indexOf('/builds/') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 404
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/delete-build-failed.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/delete-build-ok.json', 'utf8');
      }
    }

    // listBuildRuns
    if (options.method === 'GET' && options.path.indexOf('/buildruns') > -1) {
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
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/list-buildruns-empty.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/list-buildruns-ok.json', 'utf8');
      }
    }

    // createBuildRun
    if (options.method === 'POST' && options.path.indexOf('/buildruns') > -1) {
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
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/create-buildrun-failed.json', 'utf8'));
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/create-buildrun-ok.json', 'utf8'));
      }
    }

    // deleteBuildRun
    if (options.method === 'DELETE' && options.path.indexOf('/buildruns/') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 404
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/delete-buildrun-failed.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/delete-buildrun-ok.json', 'utf8');
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

describe('getS2IBuilds()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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

    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuilds(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e.message).toEqual('accessDetails.name must be set properly');
      done();
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

    k8sBuildsService.getS2IBuilds(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetBuildsError');
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

    k8sBuildsService.getS2IBuilds(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetBuildsError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a list of builds', (done) => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuilds(getRequestContextMock(), accessDetails, labelSelector).then((list) => {
      const result = list.items;
      expect(result).toBeDefined();
      expect(result.length).toEqual(6);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toMatch('some-build-2');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getS2IBuild()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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

    const buildName: string = undefined;
    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuild(getRequestContextMock, accessDetails, buildName, labelSelector).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and resourceName must be set properly');
      done();
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

    const buildName = 'foo';
    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuild(getRequestContextMock, accessDetails, buildName, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetBuildError');
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

    const buildName = 'foo';
    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuild(getRequestContextMock, accessDetails, buildName, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetBuildError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a build', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const buildName = 'foo';
    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuild(getRequestContextMock, accessDetails, buildName, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Build');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('some-build');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('createS2IBuild()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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
    let build: buildModel.IBuild;

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    build = undefined;

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    build = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    build = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildToCreate must be set properly');
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
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    // it is expected that the HTTP call returns an error (see mock -> accessToken=>something-sutpid)
    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateBuildError');
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
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateBuildError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails because build with same name exists', (done) => {

    const accessDetails = {
      accessToken: 'something-exists',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToCreateBuildBecauseAlreadyExistsError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('created a build resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.createS2IBuild(getRequestContextMock(), accessDetails, build).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Build');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('updateS2IBuild()', () => {
  let k8sBuildsService;

  let accessDetails;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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

    accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
  });

  it('no input results in rejection - build is undefined', (done) => {
    const build: buildModel.IBuild = undefined;

    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build)
      .catch((e) => {
        expect(e.message).toEqual('accessDetails.name and buildToUpate must be set properly');
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it('no input results in rejection - build is empty', (done) => {
    const build = {};

    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build)
      .catch((e) => {
        expect(e.message).toEqual('accessDetails.name and buildToUpate must be set properly');
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it('no input results in rejection - accessDetails.name is undefined', (done) => {
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };
    accessDetails = undefined;

    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build)
      .catch((e) => {
        expect(e.message).toEqual('accessDetails.name and buildToUpate must be set properly');
        done();
      })
      .catch((e) => {
        fail(e);
      });
  });

  it('no input results in rejection - accessDetails.name is undefined', (done) => {
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build)
      .catch((e) => {
        expect(e.message).toEqual('accessDetails.name and buildToUpate must be set properly');
        done();
      })
      .catch((e) => {
        fail(e);
      });

  });

  it('fails due to 400 API response', (done) => {

    accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    // it is expected that the HTTP call returns an error (see mock -> accessToken=>something-sutpid)
    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToUpdateBuildError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', (done) => {

    accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToUpdateBuildError');
        done();
      }).catch((e) => {
        fail(e);
      });
  });

  it('updated a build resource', (done) => {

    accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const build: buildModel.IBuild = {
      apiVersion: 'v1',
      kind: 'Build',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        output: { image: 'some-image', credentials: { name: 'some-creds' } },
        source: { url: 'some-repo' },
        strategy: { name: 'some-strategy' }
      }
    };

    k8sBuildsService.updateS2IBuild(getRequestContextMock(), accessDetails, 'foo', build).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Build');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('deleteS2IBuild()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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

  it('deleted a build resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const buildId: string = 'foo';

    k8sBuildsService.deleteS2IBuild(getRequestContextMock(), accessDetails, buildId).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Build');
      expect(result.status).toEqual(jasmine.objectContaining({ reason: 'Succeeded', registered: 'True' }));
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('failes deleting a build resource', (done) => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const buildId: string = 'foo';

    k8sBuildsService.deleteS2IBuild(getRequestContextMock(), accessDetails, buildId).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToDeleteBuildError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });
});

// =====================================
// BuildRun
// =====================================

describe('getS2IBuildRuns()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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

    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuildRuns(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e.message).toEqual('accessDetails.name must be set properly');
      done();
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

    k8sBuildsService.getS2IBuildRuns(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetBuildRunsError');
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

    k8sBuildsService.getS2IBuildRuns(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetBuildRunsError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a list of builds', (done) => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sBuildsService.getS2IBuildRuns(getRequestContextMock(), accessDetails, labelSelector).then((list) => {
      const result = list.items;
      expect(result).toBeDefined();
      expect(result.length).toEqual(3);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toMatch('dsdfa-run-m2chl');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('createS2IBuildRun()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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
    let buildRun: buildModel.IBuildRun;

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildRunToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    buildRun = undefined;

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildRunToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    buildRun = {
      apiVersion: 'v1',
      kind: 'BuildRun',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        buildRef: { name: 'foo-bar' },
      }
    };

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildRunToCreate must be set properly');
      done();
    }).catch((e) => {
      fail(e);
    });

    buildRun = {
      apiVersion: 'v1',
      kind: 'BuildRun',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        buildRef: { name: 'foo-bar' },
      }
    };

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).catch((e) => {
      expect(e.message).toEqual('accessDetails.name and buildRunToCreate must be set properly');
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
    const buildRun: buildModel.IBuildRun = {
      apiVersion: 'v1',
      kind: 'BuildRun',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        buildRef: { name: 'foo-bar' },
      }
    };

    // it is expected that the HTTP call returns an error (see mock -> accessToken=>something-sutpid)
    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateBuildRunError');
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
    const buildRun: buildModel.IBuildRun = {
      apiVersion: 'v1',
      kind: 'BuildRun',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        buildRef: { name: 'foo-bar' },
      }
    };

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateBuildRunError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails because buildRun with same name exists', (done) => {

    const accessDetails = {
      accessToken: 'something-exists',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const buildRun: buildModel.IBuildRun = {
      apiVersion: 'v1',
      kind: 'BuildRun',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        buildRef: { name: 'foo-bar' },
      }
    };

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToCreateBuildRunError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('created a buildRun resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const buildRun: buildModel.IBuildRun = {
      apiVersion: 'v1',
      kind: 'BuildRun',
      metadata: {
        creationTimestamp: undefined,
        name: 'foo',
      },
      spec: {
        buildRef: { name: 'foo-bar' },
      }
    };

    k8sBuildsService.createS2IBuildRun(getRequestContextMock(), accessDetails, buildRun).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('BuildRun');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('deleteS2IBuildRun()', () => {
  let k8sBuildsService;

  beforeEach(() => {
    k8sBuildsService = proxyquire('../../../ts/services/k8s-build-service', {
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

  it('deleted a buildRun resource', (done) => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const buildRunId: string = 'foo';

    k8sBuildsService.deleteS2IBuildRun(getRequestContextMock(), accessDetails, buildRunId).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Status');
      expect(result.status).toEqual('Success');
      done();
    }).catch((e) => {
      fail(e);
    });
  });

  it('failes deleting a buildRun resource', (done) => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const buildRunId: string = 'foo';

    k8sBuildsService.deleteS2IBuildRun(getRequestContextMock(), accessDetails, buildRunId).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToDeleteBuildRunError');
      done();
    }).catch((e) => {
      fail(e);
    });
  });
});