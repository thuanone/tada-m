// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';

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

describe('common middleware', () => {
  let commonMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    commonMiddleware = proxyquire('../../../ts/middleware/common-middleware', {
      '../services/coligo-service': coligoServiceMock,
      '../utils/coligo-utils': coligoUtilsMock,
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

  it('should return namespace access details', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    commonMiddleware.retrieveKubeApiAccessDetails(loggerUtilMock.getLogger(), regionId, projectId, getRequestContextMock())
      .then((result: accessDetailsModel.IAccessDetails) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(coligoServiceMock.DUMMY_ACCESS_DETAILS.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the unknown error has been caught', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    commonMiddleware.retrieveKubeApiAccessDetails(loggerUtilMock.getLogger(), regionId, projectId, getRequestContextMock())
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    commonMiddleware.retrieveKubeApiAccessDetails(loggerUtilMock.getLogger(), regionId, projectId, getRequestContextMock())
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

    commonMiddleware.retrieveKubeApiAccessDetails(loggerUtilMock.getLogger(), regionId, projectId, getRequestContextMock())
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });
});
