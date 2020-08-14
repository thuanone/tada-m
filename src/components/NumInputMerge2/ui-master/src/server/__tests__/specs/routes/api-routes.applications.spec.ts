// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

import * as nconf from '../../mocks/lib/nconf';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as applicationMiddlewareMock from '../../mocks/middleware/application-middleware';
import * as projectMiddlewareMock from '../../mocks/middleware/project-middleware';

import * as request from 'supertest';

const coligoUtilsMock = {
  isMultitenantRegion: (regionId: string) => {
    if (projectMiddlewareMock.REGION_ID === regionId || projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR === regionId) {
      return true;
    }
    return false;
  },
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

describe('Testing API routes - Application - ', () => {
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
        '../endpoints/application-endpoints': proxyquire('../../../ts/endpoints/application-endpoints', {
          '../middleware/application-middleware': applicationMiddlewareMock,
          '../middleware/project-middleware': projectMiddlewareMock,
          '../utils/logger-utils': loggerUtilMock,
        }),
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

  it('should respond with a 200 on valid region url (route: list-applications)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/applications`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [applicationMiddlewareMock.DUMMY_APP] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-applications)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/applications`)
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

  it('should respond with a 400 due to a backend error (route: list-applications)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/project/${projectMiddlewareMock.PROJECT_ID}/applications`)
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

  it('should respond with a 200 on valid region, project id and app id (route: list-application-revisions)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/revisions`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [applicationMiddlewareMock.DUMMY_APP_REVISION] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-application-revisions)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/application/${applicationMiddlewareMock.APP_ID}/revisions`)
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

  it('should respond with a 400 due to a backend error (route: list-application-revisions)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}/revisions`)
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

  it('should respond with a 400 due to an unknown error (route: list-application-revisions)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}/revisions`)
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

  it('should respond with a 200 on valid region url (route: list-application-instances)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/instances`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [applicationMiddlewareMock.DUMMY_APP_INSTANCE] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: list-application-instances)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/application/${applicationMiddlewareMock.APP_ID}/instances`)
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

  it('should respond with a 400 due to a backend error (route: list-application-instances)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}/instances`)
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

  it('should respond with a 400 due to a unknown error (route: list-application-instances)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}/instances`)
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

  it('should respond with a 200 for valid region, project id and applicaton id (route: get-application)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: applicationMiddlewareMock.DUMMY_APP }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: get-application)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/FOO`)
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

  it('should respond with a 400 due to a backend error (route: get-application)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: get-application)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}`)
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

  it('should respond with a 200 for valid region, project id and applicaton id (route: get-application-route)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/route`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: applicationMiddlewareMock.DUMMY_APP_ROUTE }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: get-application-route)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/FOO/route`)
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

  it('should respond with a 400 due to a backend error (route: get-application-route)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}/route`)
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

  it('should respond with a 400 due to a unknown error (route: get-application-route)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}/route`)
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

  it('should respond a 201 for a valid application creation (route: create-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application`)
      .send(applicationMiddlewareMock.DUMMY_APP_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: applicationMiddlewareMock.DUMMY_APP }));
      })
      .expect(201)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid application creation but a missing csrf token (route: create-application)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application`)
      .send(applicationMiddlewareMock.DUMMY_APP_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: create-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const applicationToCreate = cloneObject(applicationMiddlewareMock.DUMMY_APP_FOR_CREATION);
    applicationToCreate.name = 'UPPERCASE-IS-NOT-ALLOWED';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application`)
      .send(applicationToCreate)
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

  it('should respond with a 400 on invalid input ... wrong image (route: create-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const applicationToCreate = cloneObject(applicationMiddlewareMock.DUMMY_APP_FOR_CREATION);
    applicationToCreate.template.image = ' ibmcom/helloworld'; // whitespaces are not allowed

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application`)
      .send(applicationToCreate)
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

  it('should respond a 400 for a failed application creation, due to a backend issue (route: create-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const applicationToCreate = cloneObject(applicationMiddlewareMock.DUMMY_APP_FOR_CREATION);
    applicationToCreate.name = applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application`)
      .send(applicationToCreate)
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

  it('should respond a 400 for a failed application creation, due to a unknown issue (route: create-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const applicationToCreate = cloneObject(applicationMiddlewareMock.DUMMY_APP_FOR_CREATION);
    applicationToCreate.name = applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application`)
      .send(applicationToCreate)
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

  it('should respond a 201 for a valid app-revision creation (route: create-application-revision)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/revision`)
      .send(applicationMiddlewareMock.DUMMY_APP_REVISION_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: applicationMiddlewareMock.DUMMY_APP }));
      })
      .expect(201)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid app-revision creation but a missing csrf token (route: create-application-revision)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/revision`)
      .send(applicationMiddlewareMock.DUMMY_APP_REVISION_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: create-application-revision)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    const revisionToCreate = cloneObject(applicationMiddlewareMock.DUMMY_APP_REVISION_FOR_CREATION);
    revisionToCreate.name = 'UPPERCASE-IS-NOT-ALLOWED';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/revision`)
      .send(revisionToCreate)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputPayloadError', _code: 100004 }) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond a 400 for a failed app-revision creation, due to a backend issue (route: create-application-revision)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}/revision`)
      .send(applicationMiddlewareMock.DUMMY_APP_REVISION_FOR_CREATION)
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

  it('should respond a 400 for a failed app-revision creation, due to a unknown issue (route: create-application-revision)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}/revision`)
      .send(applicationMiddlewareMock.DUMMY_APP_REVISION_FOR_CREATION)
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

  it('should respond with a 200 for a successful app deletion (route: delete-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}`)
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

  it('should respond with a 403 for app deletion operation that has not a valid csrf token (route: delete-application)', (done) => {

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}`)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 due to a backend error (route: delete-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: delete-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}`)
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

  it('should respond a 200 for a valid application invocation (route: invoke-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/invoke`)
      .send(applicationMiddlewareMock.DUMMY_PAYLOAD_FOR_INVOCATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: applicationMiddlewareMock.DUMMY_INVOCATION_RESULT }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 403 for a valid invocation but a missing csrf token (route: invoke-application)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/invoke`)
      .send(applicationMiddlewareMock.DUMMY_PAYLOAD_FOR_INVOCATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: invoke-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    const invocationPayload = cloneObject(applicationMiddlewareMock.DUMMY_PAYLOAD_FOR_INVOCATION);
    invocationPayload.url = 'SOMETHING_NOT_URL!';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID}/invoke`)
      .send(invocationPayload)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ error: jasmine.objectContaining({ name: 'BadInputPayloadError', _code: 100004 }) }));
      })
      .expect(400)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond a 400 for a failed invocation, due to a backend issue (route: invoke-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_BACKEND_ERROR}/invoke`)
      .send(applicationMiddlewareMock.DUMMY_PAYLOAD_FOR_INVOCATION)
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

  it('should respond a 400 for a failed invocation, due to a unknown issue (route: invoke-application)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/application/${applicationMiddlewareMock.APP_ID_THAT_CAUSES_ERROR}/invoke`)
      .send(applicationMiddlewareMock.DUMMY_PAYLOAD_FOR_INVOCATION)
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

});
