import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as configModel from '../../../common/model/config-model';
import * as commonContainerRegistryModel from '../../../common/model/container-registry-model';
import * as containerRegistryModel from '../model/container-registry-model';
import * as icContainerRegistryMiddleware from './container-registry-ic-middleware';
import * as dockerhubContainerRegistryMiddleware from './container-registry-dockerhub-middleware';
import * as secretsMiddleware from './secret-middleware';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:container-registry-generic');

export function getRegistryKind(serverDomain: string): commonContainerRegistryModel.RegistryKind {
  if (!serverDomain) {
    return commonContainerRegistryModel.RegistryKind.UNKNOWN;
  }

  if (serverDomain.indexOf('.icr.io') > -1) {
    return commonContainerRegistryModel.RegistryKind.IBM;
  }

  if (serverDomain.indexOf('docker.io') > -1) {
    return commonContainerRegistryModel.RegistryKind.DOCKERHUB;
  }

  return commonContainerRegistryModel.RegistryKind.UNKNOWN;
}

export function listRegistryServers(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<string[]> {
  const fn = 'listRegistryServers ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

  return new Promise<string[]>((resolve, reject) => {
    secretsMiddleware.listSecrets(ctx, regionId, projectId, 'registry')
      .then((secrets: configModel.IUISecret[]) => {
        const servers = {};

        // extract the list of servers
        for (const secret of secrets) {
          servers[(secret as configModel.IUIRegistrySecret).server] = '';
        }

        // convert the map to an array of keys
        const serverList = Object.keys(servers);
        logger.debug(ctx, `${fn}< ${serverList && serverList.length} servers`);
        return resolve(serverList);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to list all registry servers from project '${projectId}' in region '${regionId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToListRegistryServersError(projectId, err);
        }
        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export let listNamespacesOfRegistryServerDomain: containerRegistryModel.IListNamespacesOfRegistryServerDomainFunc;
listNamespacesOfRegistryServerDomain = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, serverDomain: string): Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]> => {
  const fn = 'listNamespacesOfRegistryServerDomain ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', serverDomain: '${serverDomain}'`);

  let result = Promise.resolve([]);

  // check whether the secret points to the IBM Container registry or to another well known registry
  if (getRegistryKind(serverDomain) === commonContainerRegistryModel.RegistryKind.IBM) {
    result = icContainerRegistryMiddleware.listNamespacesOfRegistryServerDomain(ctx, regionId, projectId, serverDomain);
  } else if (getRegistryKind(serverDomain) === commonContainerRegistryModel.RegistryKind.DOCKERHUB) {
    result = dockerhubContainerRegistryMiddleware.listNamespacesOfRegistryServerDomain(ctx, regionId, projectId, serverDomain);
  }

  logger.debug(ctx, `${fn}<`);
  return result;
};

export let listNamespacesOfSecret: containerRegistryModel.IListNamespacesOfSecretFunc;
listNamespacesOfSecret = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]> => {
  const fn = 'listNamespacesOfSecret ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registrySecretId: '${registrySecretId}'`);

  return secretsMiddleware.getSecret(ctx, regionId, projectId, registrySecretId)
    .then((secret) => {
      const registrySecret = secret as configModel.IUIRegistrySecret;
      let result = Promise.resolve([]);

      // check whether the secret points to the IBM Container registry or to another well known registry
      if (getRegistryKind(registrySecret.server) === commonContainerRegistryModel.RegistryKind.IBM) {
        result = icContainerRegistryMiddleware.listNamespacesOfSecret(ctx, regionId, projectId, registrySecretId);
      } else if (getRegistryKind(registrySecret.server) === commonContainerRegistryModel.RegistryKind.DOCKERHUB) {
        result = dockerhubContainerRegistryMiddleware.listNamespacesOfSecret(ctx, regionId, projectId, registrySecretId);
      }

      logger.debug(ctx, `${fn}<`);
      return result;
    });
};

export let listRepositories: containerRegistryModel.IListRepositoriesFunc;
listRepositories = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryRepository[]> => {
  const fn = 'listRepositories ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registrySecretId: '${registrySecretId}', namespaceId: '${namespaceId}'`);

  return secretsMiddleware.getSecret(ctx, regionId, projectId, registrySecretId)
    .then((secret) => {
      const registrySecret = secret as configModel.IUIRegistrySecret;
      let result = Promise.resolve([]);

      // check whether the secret points to the IBM Container registry or to another well known registry
      if (getRegistryKind(registrySecret.server) === commonContainerRegistryModel.RegistryKind.IBM) {
        result = icContainerRegistryMiddleware.listRepositories(ctx, regionId, projectId, registrySecretId, namespaceId);
      } else if (getRegistryKind(registrySecret.server) === commonContainerRegistryModel.RegistryKind.DOCKERHUB) {
        result = dockerhubContainerRegistryMiddleware.listRepositories(ctx, regionId, projectId, registrySecretId, namespaceId);
      }

      logger.debug(ctx, `${fn}<`);
      return result;
    });
};

export let listImages: containerRegistryModel.IListImagesFunc;
listImages = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string, respositoryId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryImage[]> => {
  const fn = 'listImages ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registrySecretId: '${registrySecretId}', namespaceId: '${namespaceId}', respositoryId: '${respositoryId}'`);

  return secretsMiddleware.getSecret(ctx, regionId, projectId, registrySecretId)
    .then((secret) => {
      const registrySecret = secret as configModel.IUIRegistrySecret;
      let result = Promise.resolve([]);

      // check whether the secret points to the IBM Container registry or to another well known registry
      if (getRegistryKind(registrySecret.server) === commonContainerRegistryModel.RegistryKind.IBM) {
        result = icContainerRegistryMiddleware.listImages(ctx, regionId, projectId, registrySecretId, namespaceId, respositoryId);
      } else if (getRegistryKind(registrySecret.server) === commonContainerRegistryModel.RegistryKind.DOCKERHUB) {
        result = dockerhubContainerRegistryMiddleware.listImages(ctx, regionId, projectId, registrySecretId, namespaceId, respositoryId);
      }

      logger.debug(ctx, `${fn}<`);
      return result;
    });
};
