// IBM Cloud Container Registry
// See: https://cloud.ibm.com/apidocs/container-registry
const COMP_NAME = 'cr';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as registryModel from '../model/ic-registry-model';
import * as httpUtils from '../utils/http-utils';

function getRequestHeaders(ctx: commonModel.IUIRequestContext, accessToken: string, accountId?: string): { [key: string]: string } {

  // retrieve a set of common headers from a utils functions
  let headers = Object.assign({}, httpUtils.getCommonHeaders(ctx));

  const crSpecificHeaders: { [key: string]: string } = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  // optionally add the account id
  if (accountId) {
    crSpecificHeaders.Account = accountId;
  }

  // add cr service specific headers
  headers = Object.assign(headers, crSpecificHeaders);

  return headers;
}

export function listNamespaces(ctx: commonModel.IUIRequestContext, registryServer: string, accessToken: string, accountId: string): Promise<string[]> {
  const fn = 'listNamespaces ';
  logger.debug(ctx, `${fn}> registryServer: '${registryServer}', accountId: '${accountId}'`);

  // prepend the protocol, if not set
  let serverUrl = registryServer;
  if (registryServer && !registryServer.startsWith('http')) {
    serverUrl = `https://${registryServer}`;
  }

  // specify the options for the HTTP outbound request
  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, accessToken, accountId),
    method: 'GET',
    path: '/api/v1/namespaces',
    urls: serverUrl,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::listNamespaces`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((namespaces) => {
      if (namespaces && Array.isArray(namespaces)) {

        logger.debug(ctx, `${fn}< ${namespaces.length} namespaces`);
        return namespaces as string[];
      }
      logger.debug(ctx, `${fn}< EMPTY list`);
      return [];
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToListIcrNamespacesError(err);
    });
}

export function listImages(ctx: commonModel.IUIRequestContext, registryServer: string, accessToken: string, accountId: string, namespace?: string, repository?: string): Promise<registryModel.IContainerImage[]> {
  const fn = 'listImages ';
  logger.debug(ctx, `${fn}>`);

  // prepend the protocol, if not set
  let serverUrl = registryServer;
  if (registryServer && !registryServer.startsWith('http')) {
    serverUrl = `https://${registryServer}`;
  }

  // build the query
  const qs: { [key: string]: string } = {};

  // in order to optimize performance, we skip the vuln check for fetching lists of images.
  qs.vulnerabilities = 'false';

  // Lists images that are stored in the specified namespace only. Query multiple namespaces by specifying this option for each namespace.
  // If this option is not specified, images from all namespaces in the specified IBM Cloud account are listed.
  if (namespace) {
    qs.namespace = namespace;

    // Lists images that are stored in the specified repository, under your namespaces.
    if (repository) {
      qs.repository = repository;
    }
  }

  // specify the options for the HTTP outbound request
  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, accessToken, accountId),
    method: 'GET',
    path: '/api/v1/images',
    qs,
    urls: serverUrl,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::listImages`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((images) => {

      if (images && Array.isArray(images)) {
        logger.debug(ctx, `${fn}< ${images.length} images`);
        return images as registryModel.IContainerImage[];
      }
      logger.debug(ctx, `${fn}< EMPTY list`);
      return [];
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToListIcrImagesError(err);
    });
}
