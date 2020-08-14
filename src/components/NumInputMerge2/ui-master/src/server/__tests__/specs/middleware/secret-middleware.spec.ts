// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
import * as k8sSecretsMock from '../../mocks/services/k8s-secrets-service';

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

describe('secrets middleware', () => {
  let secretsMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    secretsMiddleware = proxyquire('../../../ts/middleware/secret-middleware', {
      '../services/k8s-secrets-service': k8sSecretsMock,
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

  it('should return a list of containing one secret (listSecrets)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;

    secretsMiddleware.listSecrets(getRequestContextMock(), regionId, projectId)
      .then((result: any[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual(k8sSecretsMock.DUMMY_SECRET.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (listSecrets)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;

    secretsMiddleware.listSecrets(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case secrets could not be loaded properly (listSecrets)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_1;
    const regionId = coligoServiceMock.REGION_ID;

    secretsMiddleware.listSecrets(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(107001);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service (listSecrets)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = coligoServiceMock.REGION_ID;

    secretsMiddleware.listSecrets(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the region is not valid (listSecrets)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    secretsMiddleware.listSecrets(getRequestContextMock(), regionId, projectId)
      .catch((err) => {
        expect(err._code).toEqual(103018);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return a secret (getSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID;

    secretsMiddleware.getSecret(getRequestContextMock(), regionId, projectId, secretId)
      .then((result: configModel.IUISecret) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(k8sSecretsMock.DUMMY_SECRET.metadata.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the API server can not resolve the project (getSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID;

    secretsMiddleware.getSecret(getRequestContextMock(), regionId, projectId, secretId)
      .catch((err) => {
        expect(err._code).toEqual(103017);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (getSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID_THAT_CAUSES_BACKEND_ERROR;

    secretsMiddleware.getSecret(getRequestContextMock(), regionId, projectId, secretId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case secret could not be loaded properly (getSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID_THAT_CAUSES_EXCEPTION;

    secretsMiddleware.getSecret(getRequestContextMock(), regionId, projectId, secretId)
      .catch((err) => {
        expect(err._code).toEqual(107002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should create a secret (createSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretToCreate: configModel.IUIGenericSecret = {
      data: [{key: 'foo', value: 'bar'}],
      id: undefined,
      kind: commonModel.UIEntityKinds.SECRET,
      name: k8sSecretsMock.SECRET_ID,
      regionId: coligoServiceMock.REGION_ID,
      type: 'Generic',
    };

    secretsMiddleware.createSecret(getRequestContextMock(), regionId, projectId, secretToCreate)
      .then((result: configModel.IUISecret) => {
        expect(result).toBeDefined();
        expect(result.name).toEqual(secretToCreate.name);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (createApplication)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretToCreate: configModel.IUIGenericSecret = {
      data: [{key: 'foo', value: 'bar'}],
      id: undefined,
      kind: commonModel.UIEntityKinds.SECRET,
      name: k8sSecretsMock.SECRET_ID_THAT_CAUSES_BACKEND_ERROR,
      regionId: coligoServiceMock.REGION_ID,
      type: 'Generic',
    };

    secretsMiddleware.createSecret(getRequestContextMock(), regionId, projectId, secretToCreate)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case secret could not be created properly (createSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretToCreate: configModel.IUIGenericSecret = {
      data: [{key: 'foo', value: 'bar'}],
      id: undefined,
      kind: commonModel.UIEntityKinds.SECRET,
      name: k8sSecretsMock.SECRET_ID_THAT_CAUSES_EXCEPTION,
      regionId: coligoServiceMock.REGION_ID,
      type: 'Generic',
    };

    secretsMiddleware.createSecret(getRequestContextMock(), regionId, projectId, secretToCreate)
      .catch((err) => {
        expect(err._code).toEqual(107003);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should delete a secret (deleteSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID;

    secretsMiddleware.deleteSecret(getRequestContextMock(), regionId, projectId, secretId)
      .then((result: commonModel.IUIOperationResult) => {
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.status).toEqual('OK');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('re-throws an error that was thrown by the backend service (deleteSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID_THAT_CAUSES_BACKEND_ERROR;

    secretsMiddleware.deleteSecret(getRequestContextMock(), regionId, projectId, secretId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('returns an error in case secret could not be deleted properly (deleteSecret)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = coligoServiceMock.REGION_ID;
    const secretId = k8sSecretsMock.SECRET_ID_THAT_CAUSES_EXCEPTION;

    secretsMiddleware.deleteSecret(getRequestContextMock(), regionId, projectId, secretId)
      .catch((err) => {
        expect(err._code).toEqual(107005);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

});
