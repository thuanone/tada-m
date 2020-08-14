import * as commonModel from '../../../common/model/common-model';
import * as containerRegistryModel from '../../../common/model/container-registry-model';

export interface IDockerAccess {
  token: string;
}

/**
 * Function that lists all namespaces that point to the given registry server domain (e.g. us.icr.io)
 */
export type IListNamespacesOfRegistryServerDomainFunc = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, serverDomain: string) => Promise<containerRegistryModel.IUIContainerRegistryNamespace[]>;

/**
 * Function that lists all registry namespaces of the given secret
 */
export type IListNamespacesOfSecretFunc = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string) => Promise<containerRegistryModel.IUIContainerRegistryNamespace[]>;

/**
 * Function that lists all registry repositories of the namespace with given secret
 */
export type IListRepositoriesFunc = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string) => Promise<containerRegistryModel.IUIContainerRegistryRepository[]>;

/**
 * Function that lists all registry images of the given secret
 */
export type IListImagesFunc = (ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, registrySecretId: string, namespaceId: string, respository: string) => Promise<containerRegistryModel.IUIContainerRegistryImage[]>;
