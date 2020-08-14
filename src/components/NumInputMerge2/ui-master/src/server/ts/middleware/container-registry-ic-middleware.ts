import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as configModel from '../../../common/model/config-model';
import * as commonContainerRegistryModel from '../../../common/model/container-registry-model';
import * as containerRegistryModel from '../model/container-registry-model';
import * as containerRegistryMapper from '../mapper/container-registry-mapper';
import * as cacheUtils from '../utils/cache-utils';
import * as secretsMiddleware from './secret-middleware';
import * as iamModel from '../model/iam-model';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:container-registry-ic');

import * as blueProm from 'bluebird';

import * as iamService from '../services/ic-iam-service';
import * as icRegistryService from '../services/ic-registry-service';

// TTL in seconds
const PROJECT_INFO_CACHE_TTL = 60 * 60; // one hour
const icrAccessDetailsCache = cacheUtils.getCacheInstance('icr-access-details', PROJECT_INFO_CACHE_TTL, 1000);

declare interface IPromiseConstructorExt extends PromiseConstructor {
  allSettled(promises: Array<Promise<any>>): Promise<Array<{ status: 'fulfilled' | 'rejected', value?: any, reason?: any }>>;
}

export interface IRegistryAccessDetails {
  server: string;
  accessToken: string;
  accountId: string;
}

export function getIamBaseUrlForRegistryDomain(registryDomain: string) {

  if (registryDomain && registryDomain.indexOf('stg.') > -1) {
    return 'https://iam.test.cloud.ibm.com';
  }
  return 'https://iam.cloud.ibm.com';
}

export function getRegistryAccessDetails(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registryId: string): Promise<IRegistryAccessDetails> {
  const fn = 'getRegistryAccessDetails ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registryId: '${registryId}'`);

  return new Promise<IRegistryAccessDetails>((resolve, reject) => {

    // check whether the access details were fetched before
    const cacheKey = `${projectId}::${registryId}`;
    const cachedDetails = icrAccessDetailsCache.getDecryptedJson(ctx, cacheKey);
    if (cachedDetails) {
      logger.debug(ctx, `${fn}< from cache`);
      return resolve(cachedDetails);
    }

    // fetch the registry secret
    const registrySecretProm = secretsMiddleware.getSecret(ctx, regionId, projectId, registryId, true)
      .then((secret) => {
        logger.debug(ctx, `${fn}- secret: '${configModel.stringify(secret)}'`);
        // check whether the type of the retreived secret is correct
        if (secret.type === 'Registry') {
          return secret as configModel.IUIRegistrySecret;
        }
        throw new commonErrors.FailedToGetSecretError(undefined, registryId);
      });

    // retrieve the IAM tokens for the given API key
    const iamTokensProm = registrySecretProm.then((registrySecret) => {
      return iamService.retrieveIAMAccessTokenForApiKey(ctx, registrySecret.password, getIamBaseUrlForRegistryDomain(registrySecret.server));
    });

    // use bluebird join function to wait for the results of both calls
    blueProm.join(registrySecretProm, iamTokensProm, (registrySecret: configModel.IUIRegistrySecret, iamTokens: iamModel.IIamTokens) => {
      // retrieve the details of the provided API key
      iamService.getDetailsOfApiKey(ctx, registrySecret.password, getIamBaseUrlForRegistryDomain(registrySecret.server), iamTokens.access_token)
        .then((accountInfo) => {

          const accessDetails = {
            accessToken: iamTokens.access_token,
            accountId: accountInfo.account_id,
            server: registrySecret.server,
          } as IRegistryAccessDetails;

          // store the new access details object in the cache
          icrAccessDetailsCache.putEncryptedJson(ctx, cacheKey, accessDetails);

          logger.debug(ctx, `${fn}<`);
          return resolve(accessDetails);
        })
        .catch((err) => {
          let error = err;
          if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to get details about the registry access details of registry '${registryId}' in region '${regionId}' and project '${projectId}'`, err);
            // wrap the error object in a specifc coligo error object
            error = new commonErrors.FailedToGetRegistryAccessDetailsError(projectId, registryId, err);
          }

          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
          reject(error);
        });
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to get the registry access details of registry '${registryId}' in region '${regionId}' and project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetRegistryAccessDetailsError(projectId, registryId, err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });

  });
}

export function listSecretsThatPointToServer(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, server: string): Promise<string[]> {
  const fn = 'listSecretsThatPointToServer ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', server: '${server}'`);

  return new Promise<string[]>((resolve, reject) => {
    secretsMiddleware.listSecrets(ctx, regionId, projectId, 'registry')
      .then((secrets: configModel.IUISecret[]) => {
        const secretIds = [];

        // check each secret whether it points to the given registry server
        for (const secret of secrets) {
          if ((secret as configModel.IUIRegistrySecret).server === server) {
            secretIds.push(secret.name);
          }
        }

        // return the map of secrets
        logger.debug(ctx, `${fn}< ${secretIds.length} secrets that point to '${server}'`);
        return resolve(secretIds);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to list all registry secrets from project '${projectId}' in region '${regionId}' that point to the server '${server}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToListSecretsThatPointToServerError(projectId, server, err);
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

  return new Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]>((resolve, reject) => {

    // first, retrieve all secrets that point to the given registry server
    listSecretsThatPointToServer(ctx, regionId, projectId, serverDomain)
      .then((registries: string[]) => {
        logger.debug(ctx, `${fn}- gathering the namespaces of ${registries && registries.length} regisistries...`);

        // store all async operations within a promise
        const namespacePromises = [];
        for (const registryId of registries) {
          // fetch the namespaces of the given secret
          namespacePromises.push(listNamespacesOfSecret(ctx, regionId, projectId, registryId));
        }

        // we are using allSettled to be able to retrieve all succeeded even if one ore more failed
        (Promise as IPromiseConstructorExt).allSettled(namespacePromises).then((results) => {
          let allNamespaces: commonContainerRegistryModel.IUIContainerRegistryNamespace[] = [];

          let idx = 0;
          for (const result of results) {

            // check whether the result failed
            if (result.status === 'fulfilled') {
              allNamespaces = allNamespaces.concat(result.value);
            } else {
              logger.info(ctx, `- failed to retrieve namespaces of registry secret '${registries[idx]}' from project '${projectId}' in region '${regionId}' - reason: '${commonErrors.stringify(result.reason)}'`);
            }
            idx += 1;
          }

          logger.debug(ctx, `${fn}< ${allNamespaces.length} namespaces`);
          resolve(allNamespaces);
        });
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to list all namespaces from project '${projectId}' in region '${regionId}' that point to the server domain '${serverDomain}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToListNamespacesOfServerDomainError(projectId, serverDomain, err);
        }
        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
};

export let listNamespacesOfSecret: containerRegistryModel.IListNamespacesOfSecretFunc;
listNamespacesOfSecret = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]> => {
  const fn = 'listNamespacesOfSecret ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registrySecretId: '${registrySecretId}'`);

  return new Promise<commonContainerRegistryModel.IUIContainerRegistryNamespace[]>((resolve, reject) => {

    // fetch the access details of the given registry
    getRegistryAccessDetails(ctx, regionId, projectId, registrySecretId)
      .then((accessDetails: IRegistryAccessDetails) => {

        // fetch all namespaces of this registry
        return icRegistryService.listNamespaces(ctx, accessDetails.server, accessDetails.accessToken, accessDetails.accountId);
      })
      .then((namespaces) => {
        // convert the backend API objects to UI objects
        const containerRegistryNamespaces = containerRegistryMapper.convertIcrNamespacesToUiNamespaces(namespaces, regionId, projectId, registrySecretId);

        logger.debug(ctx, `${fn}< ${containerRegistryNamespaces && containerRegistryNamespaces.length} namespaces`);
        resolve(containerRegistryNamespaces as commonContainerRegistryModel.IUIContainerRegistryNamespace[]);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get namespaces of registry '${registrySecretId}' from project '${projectId}' in region '${regionId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToListNamespacesOfRegistryError(projectId, registrySecretId, err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
};

export let listRepositories: containerRegistryModel.IListRepositoriesFunc;
listRepositories = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryRepository[]> => {
  const fn = 'listRepositories ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registrySecretId: '${registrySecretId}', namespaceId: '${namespaceId}'`);

  return new Promise<commonContainerRegistryModel.IUIContainerRegistryRepository[]>((resolve, reject) => {

    // fetch the access details of the given registry
    getRegistryAccessDetails(ctx, regionId, projectId, registrySecretId)
      .then((accessDetails: IRegistryAccessDetails) => {

        // fetch all images of this registry
        return icRegistryService.listImages(ctx, accessDetails.server, accessDetails.accessToken, accessDetails.accountId, namespaceId);
      })
      .then((images) => {
        // convert the backend API objects to UI objects
        const containerRegistryRepositories = containerRegistryMapper.convertIcrImagesToUiRepositories(images, regionId, projectId, registrySecretId);

        logger.debug(ctx, `${fn}< ${containerRegistryRepositories && containerRegistryRepositories.length} repositories`);
        resolve(containerRegistryRepositories as commonContainerRegistryModel.IUIContainerRegistryRepository[]);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get repositories of registry '${registrySecretId}' from project '${projectId}' in region '${regionId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToListRepositoriesOfRegistryError(projectId, registrySecretId, err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
};

export let listImages: containerRegistryModel.IListImagesFunc;
listImages = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string, respositoryId: string): Promise<commonContainerRegistryModel.IUIContainerRegistryImage[]> => {
  const fn = 'listImages ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', registrySecretId: '${registrySecretId}', namespaceId: '${namespaceId}', respositoryId: '${respositoryId}'`);

  return new Promise<commonContainerRegistryModel.IUIContainerRegistryImage[]>((resolve, reject) => {

    // fetch the access details of the given registry
    getRegistryAccessDetails(ctx, regionId, projectId, registrySecretId)
      .then((accessDetails: IRegistryAccessDetails) => {

        // fetch all namespaces of this registry
        return icRegistryService.listImages(ctx, accessDetails.server, accessDetails.accessToken, accessDetails.accountId, namespaceId, respositoryId);
      })
      .then((images) => {
        // convert the backend API objects to UI objects
        const containerRegistryImages = containerRegistryMapper.convertIcrImagesToUiImages(images, regionId, projectId, registrySecretId);

        logger.debug(ctx, `${fn}< ${containerRegistryImages && containerRegistryImages.length} images`);
        resolve(containerRegistryImages as commonContainerRegistryModel.IUIContainerRegistryImage[]);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get images of registry '${registrySecretId}' from project '${projectId}' in region '${regionId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToListImagesOfRegistryError(projectId, registrySecretId, err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
};
