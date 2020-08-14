// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonModel from '../../../../common/model/common-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as confmapMiddlewareMock from '../../mocks/middleware/confmap-middleware';
import * as secretMiddlewareMock from '../../mocks/middleware/secret-middleware';
import * as coligoServiceMock from '../../mocks/services/coligo-service';

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'some-tid',
  };
}

describe('config middleware', () => {
  let configMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    configMiddleware = proxyquire('../../../ts/middleware/config-middleware', {
      '../utils/logger-utils': loggerUtilMock,
      './confmap-middleware': confmapMiddlewareMock,
      './secret-middleware': secretMiddlewareMock,
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

  it('should return a list of two configs', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    configMiddleware.listConfigItems(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(2);
        expect(result[0].name).toEqual(confmapMiddlewareMock.DUMMY_CONFMAP.name);
        expect(result[1].name).toEqual(secretMiddlewareMock.DUMMY_SECRET.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });
});
