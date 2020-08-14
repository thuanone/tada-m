
// authentication: https://docs.docker.com/registry/spec/auth/token/
// https://success.docker.com/article/how-do-i-authenticate-with-the-v2-api
// personal access tokens: https://www.docker.com/blog/docker-hub-new-personal-access-tokens/

// list repositories
// https://docs.docker.com/registry/spec/api/#listing-repositories

// list image tags
// https://docs.docker.com/registry/spec/api/#listing-image-tags

const COMP_NAME = 'dockerhub';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as containerRegistryModel from '../model/container-registry-model';

import * as httpUtils from '../utils/http-utils';

const DOCKERHUB_SERVER_URL = 'https://hub.docker.com';

function getRequestHeaders(ctx: commonModel.IUIRequestContext, authorizationToken?: string): { [key: string]: string } {

  // these are dockerhub specific headers
  const dockerhubSpecificHeaders: { [key: string]: string } = {
    'Content-Type': 'application/json',
  };

  if (authorizationToken) {
    dockerhubSpecificHeaders.Authorization = `JWT ${authorizationToken}`;
  }

  return dockerhubSpecificHeaders;
}

/**
 * Retrieves the access token, which is necessary to talk to Docker Hub
 *
 * @param {String} ctx - the request context
 * @param {String} clusterId - The id of the cluster that should be examined
 * @param {String} namespaceId - The id of the namespace
 * @param {String} accessToken - The users access token
 * @param {String} refreshToken - The users refresh token
 */
export function getAccessToken(ctx: commonModel.IUIRequestContext, username: string, password: string): Promise<containerRegistryModel.IDockerAccess> { // pragma: allowlist secret
  const fn = 'getAccessToken ';
  logger.debug(ctx, `${fn}>`);

  // specify the options for the HTTP outbound request
  const options = {
    cachePolicy: 'NO_CACHE',
    data: {
      username,
      password, // pragma: allowlist secret
    },
    headers: getRequestHeaders(ctx),
    method: 'POST',
    path: '/v2/users/login/',
    urls: DOCKERHUB_SERVER_URL,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::getAccessToken`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((accessToken) => {
      logger.debug(ctx, `${fn}< ${accessToken}`);
      return accessToken as containerRegistryModel.IDockerAccess;
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToGetDockerHubAccessTokenError(err);
    });
}

export function listNamespaces(ctx: commonModel.IUIRequestContext, accessToken: string, accountId: string): Promise<string[]> {
  const fn = 'listNamespaces ';
  logger.debug(ctx, `${fn}> accountId: '${accountId}'`);

  // build the query
  const qs: { [key: string]: string } = {};
  qs.page_size = '10000';

  // specify the options for the HTTP outbound request
  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, accessToken),
    method: 'GET',
    path: '/v2/repositories/namespaces/',
    urls: DOCKERHUB_SERVER_URL,
    qs,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::listNamespaces`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((response) => {
      logger.trace(ctx, `${fn}- response: '${JSON.stringify(response)}'`);
      if (response && response.namespaces && Array.isArray(response.namespaces)) {

        logger.debug(ctx, `${fn}< ${response.namespaces.length} namespaces`);
        return response.namespaces as string[];
      }
      logger.debug(ctx, `${fn}< EMPTY list`);
      return [];
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToListDockerHubNamespacesError(err);
    });
}

export function listRepositories(ctx: commonModel.IUIRequestContext, accessToken: string, namespace: string, page: number = 1, list?: any[]): Promise<any[]> {
  const fn = 'listRepositories ';
  logger.debug(ctx, `${fn}> namespace: '${namespace}'`);

  // build the query
  const qs: { [key: string]: string } = {};
  qs.page_size = '1000';
  qs.page = `${page}`;

  // specify the options for the HTTP outbound request
  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, accessToken),
    method: 'GET',
    path: `/v2/repositories/${namespace}/`,
    qs,
    urls: DOCKERHUB_SERVER_URL,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::listRepositories`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((response) => {
      logger.trace(ctx, `${fn}- response: '${JSON.stringify(response)}'`);

      if (response && response.results && Array.isArray(response.results)) {

        // concat the result with the given list
        const resultList = [...(list || []), ...(response.results as any[])];

        // check whether there are more pages that should be fetched
        if (response.next && response.next.startsWith(DOCKERHUB_SERVER_URL)) {
          return listRepositories(ctx, accessToken, namespace, page + 1, resultList);
        }
        logger.debug(ctx, `${fn}< ${resultList.length} repositories`);
        return resultList;
      }
      logger.debug(ctx, `${fn}< EMPTY list`);
      return [];
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToListDockerHubRepositoriesError(err);
    });
}

export function listImages(ctx: commonModel.IUIRequestContext, accessToken: string, namespace: string, repository: string, page: number = 1, list?: any[]): Promise<any> {
  const fn = 'listImages ';
  logger.debug(ctx, `${fn}> namespace: '${namespace}', repository: '${repository}'`);

  // build the query
  const qs: { [key: string]: string } = {};
  qs.page_size = '1000';
  qs.page = `${page}`;

  // specify the options for the HTTP outbound request
  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, accessToken),
    method: 'GET',
    path: `/v2/repositories/${namespace}/${repository}/tags`,
    qs,
    urls: DOCKERHUB_SERVER_URL,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::listImages`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((response) => {
      logger.trace(ctx, `${fn}- response: '${JSON.stringify(response)}'`);

      if (response && response.results && Array.isArray(response.results)) {

        // concat the result with the given list
        const resultList = [...(list || []), ...(response.results as any[])];

        // check whether there are more pages that should be fetched
        if (response.next && response.next.startsWith(DOCKERHUB_SERVER_URL)) {
          return listImages(ctx, accessToken, namespace, repository, page + 1, resultList);
        }

        logger.debug(ctx, `${fn}< ${resultList.length} images`);
        return resultList;
      }
      logger.debug(ctx, `${fn}< EMPTY list`);
      return [];
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToListDockerHubImagesError(err);
    });
}
