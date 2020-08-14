import { SERVICE_ID_THAT_CAUSES_BACKEND_ERROR, SERVICE_ID_THAT_CAUSES_EXCEPTION } from './../../mocks/services/k8s-knative-service';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as appModel from '../../../../common/model/application-model';
import * as commonModel from '../../../../common/model/common-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
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

describe('application middleware', () => {
  let applicationMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    applicationMiddleware = proxyquire('../../../ts/middleware/application-middleware', {
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

  it('should return a list of containing one application (listApplications)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    applicationMiddleware.listApplications(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sKnativeServiceMock.DUMMY_KN_SERVICE.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (listApplications)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    applicationMiddleware.listApplications(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case applications could not be loaded properly (listApplications)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_1;
    const regionId = coligoServiceMock.REGION_ID;

    applicationMiddleware.listApplications(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(101008);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listApplications)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    applicationMiddleware.listApplications(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (listApplications)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    applicationMiddleware.listApplications(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an application (getApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID;

    applicationMiddleware.getApplication(getRequestContextMock(), regionId, projectId, appId)
      .then((result: appModel.IUIApplication) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sKnativeServiceMock.DUMMY_KN_SERVICE.metadata.name);
        expect(result.revision).toBeDefined();
        expect(result.revision.name).toEqual(k8sKnativeServiceMock.DUMMY_KN_SERVICE_REVISION.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID;

    applicationMiddleware.getApplication(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (getApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR;

    applicationMiddleware.getApplication(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case application could not be loaded properly (getApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION;

    applicationMiddleware.getApplication(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(101004);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an application route (getApplicationRoute)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID;

    applicationMiddleware.getApplicationRoute(getRequestContextMock(), regionId, projectId, appId)
      .then((result: appModel.IUIApplicationRoute) => {
        expect(result).toBeDefined();
        expect(result.trafficTargets).toBeDefined();
        expect(result.trafficTargets[k8sKnativeServiceMock.REVISION_ID]).toEqual(100);
        expect(result.routingTags).toBeDefined();
        expect(result.routingTags[k8sKnativeServiceMock.REVISION_ID]).toEqual(['latest']);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (getApplicationRoute)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR;

    applicationMiddleware.getApplicationRoute(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case application could not be loaded properly (getApplicationRoute)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION;

    applicationMiddleware.getApplicationRoute(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(101004);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a list of of revisions (listApplicationRevisions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID;

    applicationMiddleware.listApplicationRevisions(getRequestContextMock(), regionId, projectId, appId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sKnativeServiceMock.DUMMY_KN_SERVICE_REVISION.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case revisions could not be loaded properly (listApplicationRevisions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION;

    applicationMiddleware.listApplicationRevisions(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(101005);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listApplicationRevisions)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR;

    applicationMiddleware.listApplicationRevisions(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should create an application (createApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appToCreate: appModel.IUIApplication = {
      id: undefined,
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: k8sKnativeServiceMock.SERVICE_ID,
      regionId: coligoServiceMock.REGION_ID,
    };

    applicationMiddleware.createApplication(getRequestContextMock(), regionId, projectId, appToCreate)
      .then((result: appModel.IUIApplication) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(appToCreate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (createApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appToCreate: appModel.IUIApplication = {
      id: undefined,
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR,
      regionId: coligoServiceMock.REGION_ID,
    };

    applicationMiddleware.createApplication(getRequestContextMock(), regionId, projectId, appToCreate)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case application could not be created properly (createApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appToCreate: appModel.IUIApplication = {
      id: undefined,
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION,
      regionId: coligoServiceMock.REGION_ID,
    };

    applicationMiddleware.createApplication(getRequestContextMock(), regionId, projectId, appToCreate)
      .catch((err) => {
        expect(err._code).toEqual(101001);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should create an application (createApplicationRevision)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appToCreate: appModel.IUIApplication = {
      id: undefined,
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: k8sKnativeServiceMock.SERVICE_ID,
      regionId: coligoServiceMock.REGION_ID,
    };
    const appId = k8sKnativeServiceMock.SERVICE_ID;

    applicationMiddleware.createApplicationRevision(getRequestContextMock(), regionId, projectId, appId, appToCreate)
      .then((result: appModel.IUIApplication) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(appToCreate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (createApplicationRevision)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appToCreate: appModel.IUIApplication = {
      id: undefined,
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR,
      regionId: coligoServiceMock.REGION_ID,
    };
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR;

    applicationMiddleware.createApplicationRevision(getRequestContextMock(), regionId, projectId, appId, appToCreate)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case application could not be created properly (createApplicationRevision)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appToCreate: appModel.IUIApplication = {
      id: undefined,
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION,
      regionId: coligoServiceMock.REGION_ID,
    };
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION;

    applicationMiddleware.createApplicationRevision(getRequestContextMock(), regionId, projectId, appId, appToCreate)
      .catch((err) => {
        expect(err._code).toEqual(101006);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should delete an application (deleteApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID;

    applicationMiddleware.deleteApplication(getRequestContextMock(), regionId, projectId, appId)
      .then((result: commonModel.IUIOperationResult) => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.status).toEqual('OK');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (deleteApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_BACKEND_ERROR;

    applicationMiddleware.deleteApplication(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case application could not be deleted properly (deleteApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const appId = k8sKnativeServiceMock.SERVICE_ID_THAT_CAUSES_EXCEPTION;

    applicationMiddleware.deleteApplication(getRequestContextMock(), regionId, projectId, appId)
      .catch((err) => {
        expect(err._code).toEqual(101003);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

});
