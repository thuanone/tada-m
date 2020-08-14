import * as errors from '../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import * as containerRegistryModel from '../../../common/model/container-registry-model';
import * as containerRegistryMiddelware from '../middleware/container-registry-generic-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'container-registry';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function listRegistries(req, res): void {
  const fn = 'listRegistries ';
  const ctx = getClgContext(req);
  logger.debug(ctx, `${fn}>`);

  // retrieve the registry specific parameters
  const regionId: string = req.params.regionId;
  const projectId: string = req.params.projectId;

  containerRegistryMiddelware.listRegistryServers(ctx, regionId, projectId)
    .then((registries: string[]) => {
      const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, registries);
      logger.debug(ctx, `${fn}< 200 - ${registries ? registries.length : 'NULL'} registries - duration: ${result.duration}ms`);
      res.status(200).send(result);
    })
    .catch((err) => {
      let error = err;
      if (!(err instanceof errors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve registries`, err);
        error = new errors.FailedToGetBuildsError(err);
      }

      const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
      logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
      res.status(result.statusCode).send(result);
    });
}

export function listNamespacesOfRegistry(req, res): void {
  const fn = 'listNamespacesOfRegistry ';
  const ctx = getClgContext(req);
  logger.debug(ctx, `${fn}>`);

  // retrieve the registry specific parameters
  const regionId: string = req.params.regionId;
  const projectId: string = req.params.projectId;
  const registryServer: string = req.params.registryServer;

  containerRegistryMiddelware.listNamespacesOfRegistryServerDomain(ctx, regionId, projectId, registryServer)
    .then((namespaces: containerRegistryModel.IUIContainerRegistryNamespace[]) => {
      const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, namespaces);
      logger.debug(ctx, `${fn}< 200 - ${namespaces ? namespaces.length : 'NULL'} namespaces within server domain '${registryServer}' - duration: ${result.duration}ms`);
      res.status(200).send(result);
    })
    .catch((err) => {
      let error = err;
      if (!(err instanceof errors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve namespaces within server domain '${registryServer}'`, err);
        error = new errors.FailedToGetBuildsError(err);
      }

      const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
      logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
      res.status(result.statusCode).send(result);
    });
}

export function listNamespaces(req, res): void {
  const fn = 'listNamespaces ';
  const ctx = getClgContext(req);
  logger.debug(ctx, `${fn}>`);

  // retrieve the registry specific parameters
  const regionId: string = req.params.regionId;
  const projectId: string = req.params.projectId;
  const registryId: string = req.params.registryId;

  containerRegistryMiddelware.listNamespacesOfSecret(ctx, regionId, projectId, registryId)
    .then((namespaces: containerRegistryModel.IUIContainerRegistryNamespace[]) => {
      const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, namespaces);
      logger.debug(ctx, `${fn}< 200 - ${namespaces ? namespaces.length : 'NULL'} namespaces - duration: ${result.duration}ms`);
      res.status(200).send(result);
    })
    .catch((err) => {
      let error = err;
      if (!(err instanceof errors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve namespaces of registry '${registryId}'`, err);
        error = new errors.FailedToGetBuildsError(err);
      }

      const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
      logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
      res.status(result.statusCode).send(result);
    });
}

export function listRepositories(req, res): void {
  const fn = 'listRepositories ';
  const ctx = getClgContext(req);
  logger.debug(ctx, `${fn}>`);

  // retrieve the registry specific parameters
  const regionId: string = req.params.regionId;
  const projectId: string = req.params.projectId;
  const registryId: string = req.params.registryId;
  const namespaceId: string = req.params.namespaceId;

  containerRegistryMiddelware.listRepositories(ctx, regionId, projectId, registryId, namespaceId)
    .then((images: containerRegistryModel.IUIContainerRegistryRepository[]) => {
      const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, images);
      logger.debug(ctx, `${fn}< 200 - ${images ? images.length : 'NULL'} repositories - duration: ${result.duration}ms`);
      res.status(200).send(result);
    })
    .catch((err) => {
      let error = err;
      if (!(err instanceof errors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve repositories of the namespace '${namespaceId}' of the registry '${registryId}'`, err);
        error = new errors.FailedToGetBuildsError(err);
      }

      const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
      logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
      res.status(result.statusCode).send(result);
    });
}

export function listImages(req, res): void {
  const fn = 'listImages ';
  const ctx = getClgContext(req);
  logger.debug(ctx, `${fn}>`);

  // retrieve the registry specific parameters
  const regionId: string = req.params.regionId;
  const projectId: string = req.params.projectId;
  const registryId: string = req.params.registryId;
  const namespaceId: string = req.params.namespaceId;
  const respositoryId: string = req.params.repositoryId;

  containerRegistryMiddelware.listImages(ctx, regionId, projectId, registryId, namespaceId, respositoryId)
    .then((images: containerRegistryModel.IUIContainerRegistryImage[]) => {
      const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, images);
      logger.debug(ctx, `${fn}< 200 - ${images ? images.length : 'NULL'} images - duration: ${result.duration}ms`);
      res.status(200).send(result);
    })
    .catch((err) => {
      let error = err;
      if (!(err instanceof errors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve images of the namespace '${namespaceId}' of the registry '${registryId}'`, err);
        error = new errors.FailedToGetBuildsError(err);
      }

      const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
      logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
      res.status(result.statusCode).send(result);
    });
}
