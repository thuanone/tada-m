// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
import * as k8sConfigMapMock from '../../mocks/services/k8s-confmap-service';

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

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'some-tid',
  };
}

describe('confmap middleware', () => {
  let confmapMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    confmapMiddleware = proxyquire('../../../ts/middleware/confmap-middleware', {
      '../services/k8s-confmap-service': k8sConfigMapMock,
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

  it('should return a list of containing one confmap (listConfigMaps)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    confmapMiddleware.listConfigMaps(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sConfigMapMock.DUMMY_CONFMAP.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (listConfigMaps)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    confmapMiddleware.listConfigMaps(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case confmap could not be loaded properly (listConfigMaps)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_1;
    const regionId = coligoServiceMock.REGION_ID;

    confmapMiddleware.listConfigMaps(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(108001);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listConfigMaps)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    confmapMiddleware.listConfigMaps(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (listConfigMaps)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    confmapMiddleware.listConfigMaps(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a confmap (getConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID;

    confmapMiddleware.getConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .then((result: configModel.IUIConfigMap) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sConfigMapMock.DUMMY_CONFMAP.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID;

    confmapMiddleware.getConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (getConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR;

    confmapMiddleware.getConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case confmap could not be loaded properly (getConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID_THAT_CAUSES_EXCEPTION;

    confmapMiddleware.getConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .catch((err) => {
        expect(err._code).toEqual(108002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should create a confmap (createConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapToCreate: configModel.IUIConfigMap = {
      data: [{key: 'foo', value: 'bar'}],
      id: undefined,
      kind: commonModel.UIEntityKinds.CONFMAP,
      name: k8sConfigMapMock.CONFMAP_ID,
      regionId: coligoServiceMock.REGION_ID,
    };

    confmapMiddleware.createConfigMap(getRequestContextMock(), regionId, projectId, confmapToCreate)
      .then((result: configModel.IUIConfigMap) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(confmapToCreate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (createApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapToCreate: configModel.IUIConfigMap = {
      data: [{key: 'foo', value: 'bar'}],
      id: undefined,
      kind: commonModel.UIEntityKinds.CONFMAP,
      name: k8sConfigMapMock.CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR,
      regionId: coligoServiceMock.REGION_ID,
    };

    confmapMiddleware.createConfigMap(getRequestContextMock(), regionId, projectId, confmapToCreate)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case confmap could not be created properly (createConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapToCreate: configModel.IUIConfigMap = {
      data: [{key: 'foo', value: 'bar'}],
      id: undefined,
      kind: commonModel.UIEntityKinds.CONFMAP,
      name: k8sConfigMapMock.CONFMAP_ID_THAT_CAUSES_EXCEPTION,
      regionId: coligoServiceMock.REGION_ID,
    };

    confmapMiddleware.createConfigMap(getRequestContextMock(), regionId, projectId, confmapToCreate)
      .catch((err) => {
        expect(err._code).toEqual(108003);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should delete a confmap (deleteConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID;

    confmapMiddleware.deleteConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .then((result: commonModel.IUIOperationResult) => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.status).toEqual('OK');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (deleteConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID_THAT_CAUSES_BACKEND_ERROR;

    confmapMiddleware.deleteConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case confmap could not be deleted properly (deleteConfigMap)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const confmapId = k8sConfigMapMock.CONFMAP_ID_THAT_CAUSES_EXCEPTION;

    confmapMiddleware.deleteConfigMap(getRequestContextMock(), regionId, projectId, confmapId)
      .catch((err) => {
        expect(err._code).toEqual(108005);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

});
