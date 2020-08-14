// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonModel from '../../../../common/model/common-model';
import * as jobModel from '../../../../common/model/job-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
import * as k8sJobsServiceMock from '../../mocks/services/k8s-jobs-service';

const coligoUtilsMock = {
  getRegions: () => {
    return [{ id: coligoServiceMock.REGION_ID }, { id: coligoServiceMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR }];
  },
  isMultitenantRegion: (regionId: string) => {
    if (coligoServiceMock.REGION_ID === regionId || coligoServiceMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR === regionId) {
      return true;
    }
    return false;
  },
};

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'some-tid',
  };
}

describe('job middleware', () => {
  let jobMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    jobMiddleware = proxyquire('../../../ts/middleware/job-middleware', {
      '../services/k8s-jobs-service': k8sJobsServiceMock,
      '../utils/logger-utils': loggerUtilMock,
      './common-middleware': proxyquire('../../../ts/middleware/common-middleware', {
        '../services/coligo-service': coligoServiceMock,
        '../utils/coligo-utils': coligoUtilsMock,
      }),
    });
  });

  afterEach(() => {

    // reset the environment variables
    process.env.NODE_ENV = origNodeEnv;
  });

  afterAll(() => {
    // reset the environment variables
    process.env.coligoPerfMonitoringDisabled = origColigoPerfMonitoringDisabled;
    process.env.coligoPerfLoggingDisabled = origColigoPerfLoggingDisabled;
  });

  it('should return a list containing one job def (listJobDefinitions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    jobMiddleware.listJobDefinitions(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sJobsServiceMock.DUMMY_JOB_DEFINITION.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (listJobDefinitions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    jobMiddleware.listJobDefinitions(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case jobdefinitions could not be loaded properly (listJobDefinitions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_2;
    const regionId = coligoServiceMock.REGION_ID;

    jobMiddleware.listJobDefinitions(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(102002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listJobDefinitions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    jobMiddleware.listJobDefinitions(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (listJobDefinitions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    jobMiddleware.listJobDefinitions(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a job def (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const jobDefId = k8sJobsServiceMock.JOBDEF_ID;

    jobMiddleware.getJobDefinition(getRequestContextMock(), regionId, projectId, jobDefId)
      .then((result: jobModel.IUIJobDefinition) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sJobsServiceMock.DUMMY_JOB_DEFINITION.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const jobDefId = k8sJobsServiceMock.JOBDEF_ID;

    jobMiddleware.getJobDefinition(getRequestContextMock(), regionId, projectId, jobDefId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;
    const jobDefId = k8sJobsServiceMock.JOBDEF_ID;

    jobMiddleware.getJobDefinition(getRequestContextMock(), regionId, projectId, jobDefId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const jobDefId = k8sJobsServiceMock.JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR;

    jobMiddleware.getJobDefinition(getRequestContextMock(), regionId, projectId, jobDefId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';
    const jobDefId = k8sJobsServiceMock.JOBDEF_ID;

    jobMiddleware.getJobDefinition(getRequestContextMock(), regionId, projectId, jobDefId)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the job backend service throw an error (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const jobDefId = k8sJobsServiceMock.JOBDEF_ID_THAT_CAUSES_ERROR;

    jobMiddleware.getJobDefinition(getRequestContextMock(), regionId, projectId, jobDefId)
      .catch((err) => {
        expect(err._code).toEqual(102003);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a job run (getJobRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const jobRunName = k8sJobsServiceMock.JOBRUN_ID;

    jobMiddleware.getJobRun(getRequestContextMock(), regionId, projectId, jobRunName)
      .then((result: jobModel.IUIJobRun) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sJobsServiceMock.DUMMY_JOB_RUN.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getJobRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const jobRunName = k8sJobsServiceMock.JOBRUN_ID;

    jobMiddleware.getJobRun(getRequestContextMock(), regionId, projectId, jobRunName)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (getJobRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;
    const jobRunName = k8sJobsServiceMock.JOBRUN_ID;

    jobMiddleware.getJobRun(getRequestContextMock(), regionId, projectId, jobRunName)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (getJobRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const jobRunName = k8sJobsServiceMock.JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR;

    jobMiddleware.getJobRun(getRequestContextMock(), regionId, projectId, jobRunName)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (getJobRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';
    const jobRunName = k8sJobsServiceMock.JOBRUN_ID;

    jobMiddleware.getJobRun(getRequestContextMock(), regionId, projectId, jobRunName)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the job backend service throw an error (getJobDefinition)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const jobRunName = k8sJobsServiceMock.JOBRUN_ID_THAT_CAUSES_ERROR;

    jobMiddleware.getJobRun(getRequestContextMock(), regionId, projectId, jobRunName)
      .catch((err) => {
        expect(err._code).toEqual(102005);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });
});
