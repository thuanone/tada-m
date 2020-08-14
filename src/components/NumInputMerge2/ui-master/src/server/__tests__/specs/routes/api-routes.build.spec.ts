// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as buildMiddlewareMock from '../../mocks/middleware/build-middleware';
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

describe('Testing API routes - Build - ', () => {
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
        '../endpoints/build-endpoints': proxyquire('../../../ts/endpoints/build-endpoints', {
          '../middleware/build-middleware': buildMiddlewareMock,
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

  it('should respond with a 200 on valid region url (route: list-builds)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/builds`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [buildMiddlewareMock.DUMMY_BUILD] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-builds)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/builds`)
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

  it('should respond with a 400 due to a backend error (route: list-builds)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/builds`)
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

  it('should respond with a 200 for valid region, project id and build id (route: get-build)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: buildMiddlewareMock.DUMMY_BUILD }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: get-build)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/FOO`)
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

  it('should respond with a 400 due to a backend error (route: get-build)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: get-build)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}/build/${buildMiddlewareMock.BUILD_ID_THAT_CAUSES_ERROR}`)
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

  it('should respond a 201 for a valid build creation (route: create-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build`)
      .send(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: buildMiddlewareMock.DUMMY_BUILD }));
      })
      .expect(201)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid build creation but a missing csrf token (route: create-build)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build`)
      .send(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: create-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToCreate.name = 'UPPERCASE-IS-NOT-ALLOWED';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build`)
      .send(buildToCreate)
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

  it('should respond with a 400 on invalid input ... wrong key name (route: create-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToCreate.sourceUrl = 'some invalid'; // whitespaces are not allowed

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build`)
      .send(buildToCreate)
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

  it('should respond a 400 for a failed build creation, due to a backend issue (route: create-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToCreate.name = buildMiddlewareMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build`)
      .send(buildToCreate)
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

  it('should respond a 400 for a failed build creation, due to a unknown issue (route: create-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToCreate.name = buildMiddlewareMock.BUILD_ID_THAT_CAUSES_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build`)
      .send(buildToCreate)
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

  it('should respond a 200 for a valid build update (route: update-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .put(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
      .send(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: buildMiddlewareMock.DUMMY_BUILD }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid build update but a missing csrf token (route: update-build)', (done) => {

    request(expressApp)
      .put(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
      .send(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: update-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToUpdate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToUpdate.name = 'UPPERCASE-IS-NOT-ALLOWED';

    request(expressApp)
      .put(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
      .send(buildToUpdate)
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

  it('should respond with a 400 on invalid input ... wrong key name (route: update-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToUpdate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToUpdate.sourceUrl = 'some invalid'; // whitespaces are not allowed

    request(expressApp)
      .put(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
      .send(buildToUpdate)
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

  it('should respond a 400 for a failed build update, due to a backend issue (route: update-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToUpdate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToUpdate.name = buildMiddlewareMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR;

    request(expressApp)
      .put(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR}`)
      .send(buildToUpdate)
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

  it('should respond a 400 for a failed build update, due to a unknown issue (route: update-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildToUpdate = cloneObject(buildMiddlewareMock.DUMMY_BUILD_FOR_CREATION);
    buildToUpdate.name = buildMiddlewareMock.BUILD_ID_THAT_CAUSES_ERROR;

    request(expressApp)
      .put(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID_THAT_CAUSES_ERROR}`)
      .send(buildToUpdate)
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

  it('should respond with a 200 for a successful build deletion (route: delete-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
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

  it('should respond with a 403 for app deletion operation that has not a valid csrf token (route: delete-build)', (done) => {

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID}`)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: delete-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: delete-build)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/build/${buildMiddlewareMock.BUILD_ID_THAT_CAUSES_ERROR}`)
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

  // ==========================================
  // BuildRun
  // ==========================================

  it('should respond with a 200 on valid region url (route: list-buildruns)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildruns`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [buildMiddlewareMock.DUMMY_BUILDRUN] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-buildruns)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/buildruns`)
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

  it('should respond with a 400 due to a backend error (route: list-buildruns)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/buildruns`)
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

  it('should respond with a 200 for valid region, project id and build id (route: get-buildrun)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/${buildMiddlewareMock.BUILDRUN_ID}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: buildMiddlewareMock.DUMMY_BUILDRUN }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: get-buildrun)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/FOO`)
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

  it('should respond with a 400 due to a backend error (route: get-buildrun)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/${buildMiddlewareMock.BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: get-buildrun)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}/buildrun/${buildMiddlewareMock.BUILDRUN_ID_THAT_CAUSES_ERROR}`)
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

  it('should respond a 201 for a valid buildrun creation (route: create-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun`)
      .send(buildMiddlewareMock.DUMMY_BUILDRUN_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: buildMiddlewareMock.DUMMY_BUILDRUN }));
      })
      .expect(201)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid buildrun creation but a missing csrf token (route: create-buildrun)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun`)
      .send(buildMiddlewareMock.DUMMY_BUILDRUN_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: create-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildRunToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILDRUN_FOR_CREATION);
    buildRunToCreate.kind = 'FOO';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun`)
      .send(buildRunToCreate)
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

  it('should respond with a 400 on invalid input ... wrong key name (route: create-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildRunToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILDRUN_FOR_CREATION);
    buildRunToCreate.buildRef = 'some invalid'; // whitespaces are not allowed

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun`)
      .send(buildRunToCreate)
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

  it('should respond a 400 for a failed buildrun creation, due to a backend issue (route: create-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildRunToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILDRUN_FOR_CREATION);
    buildRunToCreate.name = buildMiddlewareMock.BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun`)
      .send(buildRunToCreate)
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

  it('should respond a 400 for a failed buildrun creation, due to a unknown issue (route: create-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const buildRunToCreate = cloneObject(buildMiddlewareMock.DUMMY_BUILDRUN_FOR_CREATION);
    buildRunToCreate.name = buildMiddlewareMock.BUILDRUN_ID_THAT_CAUSES_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun`)
      .send(buildRunToCreate)
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

  it('should respond with a 200 for a successful buildrun deletion (route: delete-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/${buildMiddlewareMock.BUILDRUN_ID}`)
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

  it('should respond with a 403 for app deletion operation that has not a valid csrf token (route: delete-buildrun)', (done) => {

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/${buildMiddlewareMock.BUILDRUN_ID}`)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: delete-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/${buildMiddlewareMock.BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: delete-buildrun)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/buildrun/${buildMiddlewareMock.BUILDRUN_ID_THAT_CAUSES_ERROR}`)
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
