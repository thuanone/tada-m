import * as fs from 'fs';
import * as registryModel from '../../../ts/model/ic-registry-model';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import * as commonErrors from '../../../../common/Errors';

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
    } else if (options.method === 'GET' && options.path === '/api/v1/namespaces') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/ic-container-registry/list-namespaces-failed_401.json', 'utf8');
      } else {
        // get namespace config
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/ic-container-registry/list-namespaces-ok.json', 'utf8');
      }
    } else if (options.method === 'GET' && options.path === '/api/v1/images') {
      if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 401
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/ic-container-registry/list-images-failed_401.json', 'utf8');
      } else {
        // get tenant status
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('./src/server/__tests__/mocks/backends/ic-container-registry/list-images-ok.json', 'utf8');
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

describe('IBM Container Registry Service', () => {
  let containerRegistryService;

  const OLD_ENV = process.env;

  beforeEach(() => {

    containerRegistryService = proxyquire('../../../ts/services/ic-registry-service', {
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

  it('listNamespaces() retrieves a list of registry namespaces', () => {

    const ctx = {
      tid: '123',
    };
    const registryServer = 'us.icr.io';
    const accessToken = 'something-valid';
    const accountId = 'some-account';
    containerRegistryService.listNamespaces(ctx, registryServer, accessToken, accountId).then((namespaces) => {
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
    const registryServer = 'us.icr.io';
    const accessToken = 'something-forbidden';
    const accountId = 'some-account';
    containerRegistryService.listNamespaces(ctx, registryServer, accessToken, accountId)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToListIcrNamespacesError');
        done();
      }).catch((e) =>
        fail(e)
      );

  });

  it('listImages() retrieves a list of registry images', () => {

    const ctx = {
      tid: '123',
    };
    const registryServer = 'us.icr.io';
    const accessToken = 'something-valid';
    const accountId = 'some-account';
    containerRegistryService.listImages(ctx, registryServer, accessToken, accountId).then((images: registryModel.IContainerImage[]) => {
      expect(images).toBeDefined();
      expect(images.length).toEqual(4);
    }).catch((e) => {
      fail(e);
    });
  });

  it('listImages() retrieves a list of registry images - but the user has no permission', (done) => {

    const ctx = {
      tid: '123',
    };
    const registryServer = 'us.icr.io';
    const accessToken = 'something-forbidden';
    const accountId = 'some-account';
    containerRegistryService.listImages(ctx, registryServer, accessToken, accountId)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToListIcrImagesError');
        done();
      }).catch((e) =>
        fail(e)
      );
  });
});
