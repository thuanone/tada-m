// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
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

describe('Testing API routes - Project - ', () => {
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
        '../endpoints/project-endpoints': proxyquire('../../../ts/endpoints/project-endpoints', {
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
    process.env.ORIG_coligoPerfLoggingDisabled = origColigoPerfLoggingDisabled;

    expressApp.close();
  });

  it('should render a 404 on an unknown route', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/something-stupid`)
      .set('Accept', 'application/json')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(404)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should render a 200 (route: list-resource-groups)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/resource-groups`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: jasmine.any(Object) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should render a 200 (route: list-regions)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/regions`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: [jasmine.objectContaining({ id: jasmine.any(String) })] }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should render a 400 on invalid input (route: list-projects)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/foo/projects`)
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

  it('should render a 200 on valid region url (route: list-projects)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/projects`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: jasmine.any(Object) }));
      })
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should render a 400 due to a backend error (route: list-projects)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR}/projects`)
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

  it('should render a 400 on invalid input (route: get-project)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo`)
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

  it('should render a 200 for valid region and project id (route: get-project)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: projectMiddlewareMock.DUMMY_PROJECT }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should render a 400 due to a backend error (route: get-project)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should render a 400 due to a unknown error (route: get-project)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}`)
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

  it('should render a 400 on invalid input (route: get-project-status)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/foo/status`)
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

  it('should render a 200 for valid region and project id (route: get-project-status)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}/status`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: projectMiddlewareMock.DUMMY_PROJECT_STATUS }));
      })
      .expect(200)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should render a 400 due to a backend error (route: get-project-status)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR}/status`)
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

  it('should render a 400 due to a unknown error (route: get-project-status)', (done) => {
    request(expressApp)
      .get(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}/status`)
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

  it('should respond a 403 for a valid project creation but a missing csrf token (route: create-project)', (done) => {

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/project`)
      .send(projectMiddlewareMock.DUMMY_PROJECT_FOR_CREATION)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond a 201 for a valid project creation (route: create-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/project`)
      .send(projectMiddlewareMock.DUMMY_PROJECT_FOR_CREATION)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toEqual(jasmine.objectContaining({ clgId: jasmine.any(String) }));
        expect(res.body).toEqual(jasmine.objectContaining({ status: 'OK' }));
        expect(res.body).toEqual(jasmine.objectContaining({ payload: projectMiddlewareMock.DUMMY_PROJECT }));
      })
      .expect(201)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 400 on invalid input (route: create-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const projectToCreate = cloneObject(projectMiddlewareMock.DUMMY_PROJECT_FOR_CREATION);
    projectToCreate.name = '( IS-NOT-ALLOWED';

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/project`)
      .send(projectToCreate)
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

  it('should respond a 400 for a failed project creation, due to a backend issue (route: create-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const projectToCreate = cloneObject(projectMiddlewareMock.DUMMY_PROJECT_FOR_CREATION);
    projectToCreate.name = projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/project`)
      .send(projectToCreate)
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

  it('should respond a 400 for a failed project creation, due to a unknown issue (route: create-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    // build the payload
    const projectToCreate = cloneObject(projectMiddlewareMock.DUMMY_PROJECT_FOR_CREATION);
    projectToCreate.name = projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;

    request(expressApp)
      .post(`${nconf.get('contextRoot')}api/core/v1/project`)
      .send(projectToCreate)
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

  it('should respond with a 403 for project deletion operation that has not a valid csrf token (route: delete-project)', (done) => {

    console.info(`env variables: process.env.NODE_ENV='${process.env.NODE_ENV}', coligoCsrfDisabled: '${process.env.coligoCsrfDisabled}'`);

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}`)
      .set('Accept', 'application/json')
      .expect(403)
      .end((err, res) => {
        handleTestEnd(err, res, done);
      });
  });

  it('should respond with a 200 for a successful project deletion (route: delete-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID}`)
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

  it('should respond with a 400 due to a backend error (route: delete-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR}`)
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

  it('should respond with a 400 due to a unknown error (route: delete-project)', (done) => {

    // disable CSRF validation
    process.env.NODE_ENV = 'development';
    process.env.coligoCsrfDisabled = 'true';

    request(expressApp)
      .delete(`${nconf.get('contextRoot')}api/core/v1/region/${projectMiddlewareMock.REGION_ID}/project/${projectMiddlewareMock.PROJECT_ID_THAT_CAUSES_EXCEPTION}`)
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
