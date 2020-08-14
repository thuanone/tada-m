// 3rd-party
import * as log from 'loglevel';

// coligo
import * as containerRegistryModel from '../../common/model/container-registry-model';
import {IUIRequestResult} from '../../common/model/common-model';
import utils from './utils';

const env = window.armada;
const config = env.config;

const logger = log.getLogger('api/container-registry-api');

export function listRegistries(regionId: string, projectId: string, always?: any): Promise<string[]> {
  const fn = 'listRegistries ';
  logger.debug(`${fn}>`);

  const listResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/registries`,
  });

  return new Promise<string[]>((resolve, reject) => {
    listResult.done((result: IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function listRegistryServerNamespaces(regionId: string, projectId: string, registryServer: string, always?: any): Promise<containerRegistryModel.IUIContainerRegistryNamespace[]> {
  const fn = 'listRegistryServerNamespaces ';
  logger.debug(`${fn}>`);

  const listResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/registry-server/${registryServer}/namespaces`,
  });

  return new Promise<containerRegistryModel.IUIContainerRegistryNamespace[]>((resolve, reject) => {
    listResult.done((result: IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function listRegistryNamespaces(regionId: string, projectId: string, registryId: string, always?: any): Promise<containerRegistryModel.IUIContainerRegistryNamespace[]> {
  const fn = 'listRegistryNamespaces ';
  logger.debug(`${fn}>`);

  const listResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/registry/${registryId}/namespaces`,
  });

  return new Promise<containerRegistryModel.IUIContainerRegistryNamespace[]>((resolve, reject) => {
    listResult.done((result: IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function listRegistryRepositoriesOfNamespace(regionId: string, projectId: string, registryId: string, namespaceId: string, always?: any): Promise<containerRegistryModel.IUIContainerRegistryRepository[]> {
  const fn = 'listRegistryRepositoriesOfNamespace ';
  logger.debug(`${fn}>`);

  const listResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/registry/${registryId}/namespace/${namespaceId}/repositories`,
  });

  return new Promise<containerRegistryModel.IUIContainerRegistryRepository[]>((resolve, reject) => {
    listResult.done((result: IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}

export function listRegistryImagesOfRepository(regionId: string, projectId: string, registryId: string, namespaceId: string, repositoryId: string, always?: any): Promise<containerRegistryModel.IUIContainerRegistryImage[]> {
  const fn = 'listRegistryImagesOfRepository ';
  logger.debug(`${fn}>`);

  const listResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/project/${projectId}/registry/${registryId}/namespace/${namespaceId}/repository/${repositoryId}/images`,
  });

  return new Promise<containerRegistryModel.IUIContainerRegistryImage[]>((resolve, reject) => {
    listResult.done((result: IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}
