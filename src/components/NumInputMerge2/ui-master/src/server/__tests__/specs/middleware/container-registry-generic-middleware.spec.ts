// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

import * as commonModel from '../../../../common/model/common-model';
import * as commonContainerRegistryModel from '../../../../common/model/container-registry-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as dockerHubServiceMock from '../../mocks/services/docker-registry-service';
import * as icRegistryServiceMock from '../../mocks/services/ic-registry-service';
import * as icrServiceMock from '../../mocks/services/ic-registry-service';
import * as secretMiddlewareMock from '../../mocks/middleware/secret-middleware';

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

const cacheUtilsMock = {

  getCacheInstance: () => {
    return {
      getDecryptedJson: (ctx: any, cacheKey) => {
        return {
          server: 'us.icr.io',
          accessToken: icRegistryServiceMock.ACCESSTOKEN,
          accountId: 'some',
        };
      },
    };
  }
};

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'some-tid',
  };
}

describe('registry middleware', () => {
  let registryMiddleware;

  beforeAll(() => {

    registryMiddleware = proxyquire('../../../ts/middleware/container-registry-generic-middleware', {
      '../utils/logger-utils': loggerUtilMock,
      './secret-middleware': secretMiddlewareMock,
      './container-registry-dockerhub-middleware': proxyquire('../../../ts/middleware/container-registry-dockerhub-middleware', {
        './secret-middleware': secretMiddlewareMock,
        '../services/docker-registry-service': dockerHubServiceMock,
        '../utils/logger-utils': loggerUtilMock,
      }),
      './container-registry-ic-middleware': proxyquire('../../../ts/middleware/container-registry-ic-middleware', {
        './secret-middleware': secretMiddlewareMock,
        '../services/ic-registry-service': icRegistryServiceMock,
        '../utils/logger-utils': loggerUtilMock,
        '../utils/cache-utils': cacheUtilsMock,
      }),
    });
  });

  it('listNamespaces() - should return a list of namespaces retrieved from the dockerhub container registry', (done) => {

    const regionId = 'some-region';
    const projectId = 'some-project';
    const secretId = secretMiddlewareMock.REGISTRY_SECRET_ID_DOCKERHUB;
    registryMiddleware.listNamespacesOfSecret(getRequestContextMock(), regionId, projectId, secretId)
      .then((result: commonContainerRegistryModel.IUIContainerRegistryNamespace[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].id).toEqual(dockerHubServiceMock.NAMESPACE_ID);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('listNamespaces() - should return a list of namespaces retrieved from the ibm container registry', (done) => {

    const regionId = 'some-region';
    const projectId = 'some-project';
    const secretId = secretMiddlewareMock.REGISTRY_SECRET_ID_ICR;
    registryMiddleware.listNamespacesOfSecret(getRequestContextMock(), regionId, projectId, secretId)
      .then((result: commonContainerRegistryModel.IUIContainerRegistryNamespace[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].id).toEqual(icrServiceMock.NAMESPACE_ID);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('listRepositories() - should return a list of repositories retrieved from the dockerhub container registry', (done) => {

    const regionId = 'some-region';
    const projectId = 'some-project';
    const secretId = secretMiddlewareMock.REGISTRY_SECRET_ID_DOCKERHUB;
    const namespaceId = 'some-namespaceId';
    registryMiddleware.listRepositories(getRequestContextMock(), regionId, projectId, secretId, namespaceId)
      .then((result: commonContainerRegistryModel.IUIContainerRegistryRepository[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].repository).toEqual(dockerHubServiceMock.REPOSITORY_ID);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('listRepositories() - should return a list of repositories retrieved from the ibm container registry', (done) => {

    const regionId = 'some-region';
    const projectId = 'some-project';
    const secretId = secretMiddlewareMock.REGISTRY_SECRET_ID_ICR;
    const namespaceId = 'some-namespaceId';
    registryMiddleware.listRepositories(getRequestContextMock(), regionId, projectId, secretId, namespaceId)
      .then((result: commonContainerRegistryModel.IUIContainerRegistryRepository[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].repository).toEqual(icrServiceMock.REPOSITORY_ID);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('listImages() - should return a list of images retrieved from the dockerhub container registry', (done) => {

    const regionId = 'some-region';
    const projectId = 'some-project';
    const secretId = secretMiddlewareMock.REGISTRY_SECRET_ID_DOCKERHUB;
    const namespaceId = 'some-namespaceId';
    const repositoryId = 'some-repositoryId';
    registryMiddleware.listImages(getRequestContextMock(), regionId, projectId, secretId, namespaceId, repositoryId)
      .then((result: commonContainerRegistryModel.IUIContainerRegistryImage[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].id).toEqual(dockerHubServiceMock.IMAGE_ID);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('listImages() - should return a list of images retrieved from the ibm container container registry', (done) => {

    const regionId = 'some-region';
    const projectId = 'some-project';
    const secretId = secretMiddlewareMock.REGISTRY_SECRET_ID_ICR;
    const namespaceId = 'some-namespaceId';
    const repositoryId = 'some-repositoryId';
    registryMiddleware.listImages(getRequestContextMock(), regionId, projectId, secretId, namespaceId, repositoryId)
      .then((result: commonContainerRegistryModel.IUIContainerRegistryImage[]) => {
        expect(result).toBeDefined();
        expect(result.length).toEqual(1);
        expect(result[0].id).toEqual(icrServiceMock.IMAGE_ID);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });
});
