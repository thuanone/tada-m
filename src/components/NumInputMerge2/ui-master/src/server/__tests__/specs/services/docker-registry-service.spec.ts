import * as fs from 'fs';
import * as registryModel from '../../../ts/model/dockerhub-registry-model';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import * as commonErrors from '../../../../common/Errors';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error = undefined;
    let response;
    let body;

    if (options.headers.Authorization && options.headers.Authorization.indexOf('something-stupid') > -1) {
      response = {
        statusCode: 400
      };
      body = '';
    } else if (options.headers.Authorization && options.headers.Authorization.indexOf('something-broken') > -1) {
      response = {
        statusCode: 200
      };
      body = 'this is a string not a JSON object';
    } else if (options.method === 'POST' && options.path === '/v2/users/login/') {
      if (options.data.username === 'something-forbidden') {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/get-token-failed_401.json', 'utf8');
      } else {
        // mock the response
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/get-token-ok.json', 'utf8');
      }
    } else if (options.method === 'GET' && options.path === '/v2/repositories/namespaces/') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/list-namespaces-failed_401.json', 'utf8');
      } else {
        // mock the response
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/list-namespaces-ok.json', 'utf8');
      }
    } else if (options.method === 'GET' && options.path === '/v2/repositories/some-namespace/' ) {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/list-repositories-failed_401.json', 'utf8');
      } else {
        // mock the response
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/list-repositories-ok.json', 'utf8');
      }
    } else if (options.method === 'GET' && options.path === '/v2/repositories/some-namespace/some-repository/tags') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/list-images-failed_401.json', 'utf8');
      } else {
        // get tenant status
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/dockerhub-container-registry/list-images-ok.json', 'utf8');
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

describe('DockerHub Registry Service', () => {
  let containerRegistryService;

  const OLD_ENV = process.env;

  beforeEach(() => {

    containerRegistryService = proxyquire('../../../ts/services/docker-registry-service', {
      '../utils/logger-utils': loggerUtil,
      '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
        './logger-utils': loggerUtil,
        '@console/console-platform-resiliency': resiliencyMock,
        './monitoring-utils': monitoringUtilsMock,
      }),
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('getAccessToken() retrieves a new access token for the given username password', (done) => {

    const ctx = {
      tid: '123',
    };
    const user = 'something-valid';
    const pass = 'some-pass'; // pragma: allowlist secret
    containerRegistryService.getAccessToken(ctx, user, pass).then((token) => {
      expect(token.token).toBeDefined();
      done();
    }).catch((e) => {
      fail(e);
    });

  });

  it('getAccessToken() retrieves a new access token for the given username password - but the user has no permission', (done) => {

    const ctx = {
      tid: '123',
    };
    const user = 'something-forbidden';
    const pass = 'some-pass'; // pragma: allowlist secret
    containerRegistryService.getAccessToken(ctx, user, pass)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToGetDockerHubAccessTokenError');
        done();
      }).catch((e) =>
        fail(e)
      );

  });

  it('listNamespaces() retrieves a list of registry namespaces', () => {

    const ctx = {
      tid: '123',
    };
    const accessToken = 'something-valid';
    const accountId = 'some-account';
    containerRegistryService.listNamespaces(ctx, accessToken, accountId).then((namespaces) => {
      expect(namespaces).toBeDefined();
      expect(namespaces.length).toEqual(2);
    }).catch((e) => {
      fail(e);
    });

  });

  it('listNamespaces() retrieves a list of registry namespaces - but the user has no permission', (done) => {

    const ctx = {
      tid: '123',
    };
    const accessToken = 'something-forbidden';
    const accountId = 'some-account';
    containerRegistryService.listNamespaces(ctx, accessToken, accountId)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToListDockerHubNamespacesError');
        done();
      }).catch((e) =>
        fail(e)
      );

  });

  it('listRepositories() retrieves a list of registry repositories', () => {

    const ctx = {
      tid: '123',
    };
    const accessToken = 'something-valid';
    const namespace = 'some-namespace';
    containerRegistryService.listRepositories(ctx, accessToken, namespace).then((namespaces) => {
      expect(namespaces).toBeDefined();
      expect(namespaces.length).toEqual(11);
      expect(namespaces[0].name).toEqual('self-signed-cert');
    }).catch((e) => {
      fail(e);
    });

  });

  it('listRepositories() retrieves a list of registry namespaces - but the user has no permission', (done) => {

    const ctx = {
      tid: '123',
    };
    const accessToken = 'something-forbidden';
    const namespace = 'some-namespace';
    containerRegistryService.listRepositories(ctx, accessToken, namespace)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToListDockerHubRepositoriesError');
        done();
      }).catch((e) =>
        fail(e)
      );

  });

  it('listImages() retrieves a list of registry images', () => {

    const ctx = {
      tid: '123',
    };
    const accessToken = 'something-valid';
    const namespace = 'some-namespace';
    const repository = 'some-repository';
    containerRegistryService.listImages(ctx, accessToken, namespace, repository).then((images: registryModel.IContainerImage[]) => {
      expect(images).toBeDefined();
      expect(images.length).toEqual(4);
      expect(images[0].name).toEqual('v4');
    }).catch((e) => {
      fail(e);
    });
  });

  it('listImages() retrieves a list of registry images - but the user has no permission', (done) => {

    const ctx = {
      tid: '123',
    };
    const accessToken = 'something-forbidden';
    const namespace = 'some-namespace';
    const repository = 'some-repository';
    containerRegistryService.listImages(ctx, accessToken, namespace, repository)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToListDockerHubImagesError');
        done();
      }).catch((e) =>
        fail(e)
      );
  });
});
