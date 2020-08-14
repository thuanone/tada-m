// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonModel from '../../../../common/model/common-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
import * as k8sJobsServiceMock from '../../mocks/services/k8s-jobs-service';
import * as k8sKnativeServiceMock from '../../mocks/services/k8s-knative-service';

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

describe('component middleware', () => {
  let componentMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    componentMiddleware = proxyquire('../../../ts/middleware/component-middleware', {
      '../services/k8s-jobs-service': k8sJobsServiceMock,
      '../services/k8s-knative-service': k8sKnativeServiceMock,
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

  it('should return a list of two components', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    componentMiddleware.listComponents(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(2);
        expect(result[0].name).toEqual(k8sJobsServiceMock.DUMMY_JOB_DEFINITION.metadata.name);
        expect(result[1].name).toEqual(k8sKnativeServiceMock.DUMMY_KN_SERVICE.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    componentMiddleware.listComponents(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case applications could not be loaded properly', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_1;
    const regionId = coligoServiceMock.REGION_ID;

    componentMiddleware.listComponents(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(101008);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case jobdefinitions could not be loaded properly', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_2;
    const regionId = coligoServiceMock.REGION_ID;

    componentMiddleware.listComponents(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(102002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    componentMiddleware.listComponents(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    componentMiddleware.listComponents(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });
});
