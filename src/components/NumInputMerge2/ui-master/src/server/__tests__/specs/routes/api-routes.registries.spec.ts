// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as containerRegistryMiddlewareMock from '../../mocks/middleware/container-registry-generic-middleware';
import * as projectMiddlewareMock from '../../mocks/middleware/project-middleware';
import * as nconf from '../../mocks/lib/nconf';

import * as request from 'supertest';

const coligoUtilsMock = {
  isMultitenantRegion: (regionId: string) => {
    if (containerRegistryMiddlewareMock.REGION_ID === regionId || containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR === regionId || containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_ERROR === regionId) {
      return true;
    }
    return false;
  },
};

const routesUtilsMock = {
  verifyFeatureFlag: (flag: string, req, res, next) => {
    next();
  }
};

function handleTestEnd(err, res, doneCallback) {
  if (err) {
    console.info(`response of failing test: '${JSON.stringify(res)}'`);
    doneCallback.fail(err);
  } else {
    doneCallback(); // Success!
  }
}

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

describe('Testing API routes - Container Registries - ', () => {
  let expressApp;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;
  const origColigoCsrfDisabled = process.env.coligoCsrfDisabled;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    expressApp = proxyquire('../../mocks/app-mock', {
      '../../ts/routes/api-routes': proxyquire('../../../ts/routes/api-routes', {
        '../endpoints/container-registry-endpoints': proxyquire('../../../ts/endpoints/container-registry-endpoints', {
          '../middleware/container-registry-generic-middleware': containerRegistryMiddlewareMock,
          '../utils/logger-utils': loggerUtilMock,
        }),
        '../utils/routes-utils': routesUtilsMock,
        '../utils/validation-utils': proxyquire('../../../ts/utils/validation-utils', {
          './coligo-utils': coligoUtilsMock,
        }),
      }),
    });
  });

  afterEach(() => {
    // reset the environment variables
    process.env.NODE_ENV = origNodeEnv;
    process.env.coligoCsrfDisabled = origColigoCsrfDisabled;
  });

  afterAll(() => {
    // reset the environment variables
    process.env.coligoPerfMonitoringDisabled = origColigoPerfMonitoringDisabled;
    process.env.coligoPerfLoggingDisabled = origColigoPerfLoggingDisabled;

    expressApp.close();
  });

  it('should respond with a 200 on valid region url (route: list-namespaces-of-registries)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespaces`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [containerRegistryMiddlewareMock.DUMMY_REGISTRY_NAMESPACE] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-namespaces-of-registries)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/foo/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespaces`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputError', _code: 100003 }) }));
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: list-namespaces-of-registries)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespaces`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a known backend error (route: list-namespaces-of-registries)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespaces`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 200 on valid region url (route: list-namespaces-of-registry-server)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/registry-server/docker.io/namespaces`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [containerRegistryMiddlewareMock.DUMMY_REGISTRY_NAMESPACE] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-namespaces-of-registry-server)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/foo/project/${projectMiddlewareMock.PROJECT_ID}/registry-server/docker.io/namespaces`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputError', _code: 100003 }) }));
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: list-namespaces-of-registry-server)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry-server/docker.io/namespaces`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a known backend error (route: list-namespaces-of-registry-server)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry-server/docker.io/namespaces`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 200 on valid region url (route: list-repositories-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repositories`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [containerRegistryMiddlewareMock.DUMMY_REGISTRY_REPOSITORY] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-repositories-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/foo/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repositories`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputError', _code: 100003 }) }));
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: list-repositories-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repositories`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a known backend error (route: list-repositories-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repositories`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 200 on valid region url (route: list-images-per-repository-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repository/some-repo/images`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [containerRegistryMiddlewareMock.DUMMY_REGISTRY_IMAGE] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-images-per-repository-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/foo/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repository/some-repo/images`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputError', _code: 100003 }) }));
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: list-images-per-repository-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repository/some-repo/images`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a known backend error (route: list-images-per-repository-per-namespace)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${containerRegistryMiddlewareMock.REGION_ID_THAT_CAUSES_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/registry/some-registry/namespace/some-namespace/repository/some-repo/images`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ statusCode: 400 }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.any(Object) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });
});
