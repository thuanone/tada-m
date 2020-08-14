import { BUILD_ID_THAT_CAUSES_BACKEND_ERROR } from './../../mocks/services/k8s-build-service';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonErrors from '../../../../common/Errors';
import * as buildModel from '../../../../common/model/build-model';
import * as commonModel from '../../../../common/model/common-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
import * as k8sBuildMock from '../../mocks/services/k8s-build-service';

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

describe('build middleware', () => {
  let buildMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    buildMiddleware = proxyquire('../../../ts/middleware/build-middleware', {
      '../services/k8s-build-service': k8sBuildMock,
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

  it('should return a list of containing one build (listBuilds)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuilds(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sBuildMock.DUMMY_BUILD.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (listBuilds)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuilds(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetProjectsNamespaceConfigError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case build could not be loaded properly (listBuilds)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_1;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuilds(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetBuildsError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listBuilds)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuilds(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (listBuilds)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    buildMiddleware.listBuilds(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetProjectsNamespaceConfigDueToInvalidParametersError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a build (getBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID;

    buildMiddleware.getBuild(getRequestContextMock(), regionId, projectId, buildId)
      .then((result: buildModel.IUIBuild) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sBuildMock.DUMMY_BUILD.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID;

    buildMiddleware.getBuild(getRequestContextMock(), regionId, projectId, buildId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetProjectsNamespaceConfigError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (getBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR;

    buildMiddleware.getBuild(getRequestContextMock(), regionId, projectId, buildId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case build could not be loaded properly (getBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID_THAT_CAUSES_EXCEPTION;

    buildMiddleware.getBuild(getRequestContextMock(), regionId, projectId, buildId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetBuildError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should create a build (createBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildToCreate: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: k8sBuildMock.BUILD_ID,
      outputCredentials: 'some-creds',
      outputImage: 'us.icr.io/somme/repo:image',
      regionId: coligoServiceMock.REGION_ID,
      sourceUrl: 'https://github.com/org/name',
      strategyKind: 'ClusterBuildStrategy',
      strategyName: 'kaniko',
    };

    buildMiddleware.createBuild(getRequestContextMock(), regionId, projectId, buildToCreate)
      .then((result: buildModel.IUIBuild) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(buildToCreate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (createBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildToCreate: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: k8sBuildMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR,
      outputCredentials: 'some-creds',
      outputImage: 'us.icr.io/somme/repo:image',
      regionId: coligoServiceMock.REGION_ID,
      sourceUrl: 'https://github.com/org/name',
      strategyKind: 'ClusterBuildStrategy',
      strategyName: 'kaniko',
    };

    buildMiddleware.createBuild(getRequestContextMock(), regionId, projectId, buildToCreate)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case build could not be created properly (createBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildToCreate: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: k8sBuildMock.BUILD_ID_THAT_CAUSES_EXCEPTION,
      outputCredentials: 'some-creds',
      outputImage: 'us.icr.io/somme/repo:image',
      regionId: coligoServiceMock.REGION_ID,
      sourceUrl: 'https://github.com/org/name',
      strategyKind: 'ClusterBuildStrategy',
      strategyName: 'kaniko',
    };

    buildMiddleware.createBuild(getRequestContextMock(), regionId, projectId, buildToCreate)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToCreateBuildError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should update a build (updateBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildToUpdate: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: k8sBuildMock.BUILD_ID,
      outputCredentials: 'some-creds',
      outputImage: 'us.icr.io/somme/repo:image',
      regionId: coligoServiceMock.REGION_ID,
      sourceUrl: 'https://github.com/org/name',
      strategyKind: 'ClusterBuildStrategy',
      strategyName: 'kaniko',
    };

    buildMiddleware.updateBuild(getRequestContextMock(), regionId, projectId, k8sBuildMock.BUILD_ID, buildToUpdate)
      .then((result: buildModel.IUIBuild) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(buildToUpdate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (updateBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildToUpdate: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: k8sBuildMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR,
      outputCredentials: 'some-creds',
      outputImage: 'us.icr.io/somme/repo:image',
      regionId: coligoServiceMock.REGION_ID,
      sourceUrl: 'https://github.com/org/name',
      strategyKind: 'ClusterBuildStrategy',
      strategyName: 'kaniko',
    };

    buildMiddleware.updateBuild(getRequestContextMock(), regionId, projectId, k8sBuildMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR, buildToUpdate)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case build could not be updated properly (updateBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildToUpdate: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: k8sBuildMock.BUILD_ID_THAT_CAUSES_EXCEPTION,
      outputCredentials: 'some-creds',
      outputImage: 'us.icr.io/somme/repo:image',
      regionId: coligoServiceMock.REGION_ID,
      sourceUrl: 'https://github.com/org/name',
      strategyKind: 'ClusterBuildStrategy',
      strategyName: 'kaniko',
    };

    buildMiddleware.updateBuild(getRequestContextMock(), regionId, projectId, k8sBuildMock.BUILD_ID_THAT_CAUSES_EXCEPTION, buildToUpdate)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToUpdateBuildError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should delete a build (deleteBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID;

    buildMiddleware.deleteBuild(getRequestContextMock(), regionId, projectId, buildId)
      .then((result: commonModel.IUIOperationResult) => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.status).toEqual('OK');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (deleteBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID_THAT_CAUSES_BACKEND_ERROR;

    buildMiddleware.deleteBuild(getRequestContextMock(), regionId, projectId, buildId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case build could not be deleted properly (deleteBuild)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildId = k8sBuildMock.BUILD_ID_THAT_CAUSES_EXCEPTION;

    buildMiddleware.deleteBuild(getRequestContextMock(), regionId, projectId, buildId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToDeleteBuildError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  // ===================================
  // BuildRuns
  // ===================================

  it('should return a list of containing one build (listBuildRuns)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuildRuns(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sBuildMock.DUMMY_BUILDRUN.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (listBuildRuns)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuilds(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetProjectsNamespaceConfigError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case build could not be loaded properly (listBuildRuns)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_1;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuildRuns(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetBuildRunsError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listBuildRuns)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    buildMiddleware.listBuildRuns(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (listBuildRuns)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    buildMiddleware.listBuildRuns(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetProjectsNamespaceConfigDueToInvalidParametersError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a buildRun (getBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID;

    buildMiddleware.getBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .then((result: buildModel.IUIBuildRun) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sBuildMock.DUMMY_BUILDRUN.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID;

    buildMiddleware.getBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetProjectsNamespaceConfigError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (getBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR;

    buildMiddleware.getBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case build could not be loaded properly (getBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID_THAT_CAUSES_EXCEPTION;

    buildMiddleware.getBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToGetBuildRunError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should create a buildRun (createBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunToCreate: buildModel.IUIBuildRun = {
      buildRef: 'some-build',
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILDRUN,
      name: k8sBuildMock.BUILDRUN_ID,
    };

    buildMiddleware.createBuildRun(getRequestContextMock(), regionId, projectId, buildRunToCreate)
      .then((result: buildModel.IUIBuildRun) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(buildRunToCreate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (createBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunToCreate: buildModel.IUIBuildRun = {
      buildRef: 'some-build',
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILDRUN,
      name: k8sBuildMock.BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR,
    };

    buildMiddleware.createBuildRun(getRequestContextMock(), regionId, projectId, buildRunToCreate)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case buildRun could not be created properly (createBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunToCreate: buildModel.IUIBuildRun = {
      buildRef: 'some-build',
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILDRUN,
      name: k8sBuildMock.BUILDRUN_ID_THAT_CAUSES_EXCEPTION,
    };

    buildMiddleware.createBuildRun(getRequestContextMock(), regionId, projectId, buildRunToCreate)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToCreateBuildRunError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should delete a buildRun (deleteBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID;

    buildMiddleware.deleteBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .then((result: commonModel.IUIOperationResult) => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.status).toEqual('OK');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (deleteBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR;

    buildMiddleware.deleteBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('UnknownError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case buildRun could not be deleted properly (deleteBuildRun)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const buildRunId = k8sBuildMock.BUILDRUN_ID_THAT_CAUSES_EXCEPTION;

    buildMiddleware.deleteBuildRun(getRequestContextMock(), regionId, projectId, buildRunId)
      .catch((err) => {
        expect(err instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(err.name).toEqual('FailedToDeleteBuildRunError');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

});
