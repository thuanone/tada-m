// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as confmapMiddlewareMock from '../../mocks/middleware/confmap-middleware';
import * as projectMiddlewareMock from '../../mocks/middleware/project-middleware';
import * as nconf from '../../mocks/lib/nconf';

import * as request from 'supertest';

const coligoUtilsMock = {
  isMultitenantRegion: (regionId: string) => {
    if (projectMiddlewareMock.REGION_ID === regionId || projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR === regionId) {
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

describe('Testing API routes - ConfigMap - ', () => {
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
        '../endpoints/confmap-endpoints': proxyquire('../../../ts/endpoints/confmap-endpoints', {
          '../middleware/confmap-middleware': confmapMiddlewareMock,
          '../middleware/project-middleware': projectMiddlewareMock,
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

  it('should respond with a 200 on valid region url (route: list-confmaps)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmaps`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [confmapMiddlewareMock.DUMMY_CONFMAP] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-confmaps)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/confmaps`)
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

  it('should respond with a 400 due to a backend error (route: list-confmaps)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/confmaps`)
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

  it('should respond with a 200 for valid region, project id and confmap id (route: get-confmap)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/${confmapMiddlewareMock.CONFMAP_ID}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: confmapMiddlewareMock.DUMMY_CONFMAP }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: get-confmap)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/FOO`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputError', _code: 100003 }) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: get-confmap)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/${confmapMiddlewareMock.CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: get-confmap)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}/confmap/${confmapMiddlewareMock.CONFMAP_ID_THAT_CAUSES_ERROR}`)
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

  it('should respond a 201 for a valid confmap creation (route: create-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap`)
      .send(confmapMiddlewareMock.DUMMY_CONFMAP_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: confmapMiddlewareMock.DUMMY_CONFMAP }));
      })
      .expect(201)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid configMap creation but a missing csrf token (route: create-confmap)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap`)
      .send(confmapMiddlewareMock.DUMMY_CONFMAP_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: create-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const confmapToCreate = cloneObject(confmapMiddlewareMock.DUMMY_CONFMAP_FOR_CREATION);
    confmapToCreate.name = 'UPPERCASE-IS-NOT-ALLOWED';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap`)
      .send(confmapToCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputPayloadError', _code: 100004 }) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input ... wrong key name (route: create-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const confmapToCreate = cloneObject(confmapMiddlewareMock.DUMMY_CONFMAP_FOR_CREATION);
    confmapToCreate.data = [ {key: 'some invalid', value: 'foo'}]; // whitespaces are not allowed

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap`)
      .send(confmapToCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputPayloadError', _code: 100004 }) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond a 400 for a failed confmap creation, due to a backend issue (route: create-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const confmapToCreate = cloneObject(confmapMiddlewareMock.DUMMY_CONFMAP_FOR_CREATION);
    confmapToCreate.name = confmapMiddlewareMock.CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap`)
      .send(confmapToCreate)
      .set('Content-Type', 'application/json')
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

  it('should respond a 400 for a failed confmap creation, due to a unknown issue (route: create-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const confmapToCreate = cloneObject(confmapMiddlewareMock.DUMMY_CONFMAP_FOR_CREATION);
    confmapToCreate.name = confmapMiddlewareMock.CONFMAP_ID_THAT_CAUSES_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap`)
      .send(confmapToCreate)
      .set('Content-Type', 'application/json')
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

  it('should respond with a 200 for a successful confmap deletion (route: delete-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/${confmapMiddlewareMock.CONFMAP_ID}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: { status: 'OK' } }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for app deletion operation that has not a valid csrf token (route: delete-confmap)', (done) => {

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/${confmapMiddlewareMock.CONFMAP_ID}`)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: delete-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/${confmapMiddlewareMock.CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: delete-confmap)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/confmap/${confmapMiddlewareMock.CONFMAP_ID_THAT_CAUSES_ERROR}`)
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
