import * as errors from '../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import * as commonConfigModel from '../../../common/model/config-model';
import * as confMapMiddleware from '../middleware/confmap-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'confmap';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function createConfigMap(req, res): void {
    const fn = 'createConfigMap ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const confMapToCreate: commonConfigModel.IUIConfigMap = req.body;

    // delegate the confMap creation to the confMaps middleware
    confMapMiddleware.createConfigMap(ctx, regionId, projectId, confMapToCreate)
        .then( (createdConfigMap) => {

            // TODO check whether the confMap could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdConfigMap);

            // send the created confMap back to the client
            logger.debug(ctx, `${fn}< 201 - confMap name: '${createdConfigMap.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the confMap '${commonConfigModel.stringify(confMapToCreate)}'`, err);
                error = new errors.FailedToCreateConfigMapError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listConfigMaps(req, res): void {
    const fn = 'listConfigMaps ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the confMaps of a specific project
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    confMapMiddleware.listConfigMaps(ctx, regionId, projectId)
        .then((confMaps: commonConfigModel.IUIConfigMap[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, confMaps);
            logger.debug(ctx, `${fn}< 200 - ${ confMaps ? confMaps.length : 'NULL' } confMaps - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve confMaps of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetConfigMapsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getConfigMap(req, res): void {
    const fn = 'getConfigMap ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the specific confMap
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const confMapId: string = req.params.confMapId;

    confMapMiddleware.getConfigMap(ctx, regionId, projectId, confMapId)
        .then((confMap: commonConfigModel.IUIConfigMap) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, confMap);
            logger.debug(ctx, `${fn}< 200 - confMap: '${confMap.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve confMap '${confMapId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetConfigMapError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteConfigMap(req, res): void {
    const fn = 'deleteConfigMap ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const confMapId: string = req.params.confMapId;

    // delete the confMap
    confMapMiddleware.deleteConfigMap(ctx, regionId, projectId, confMapId)
        .then((operationResult: commonModel.IUIOperationResult) => {

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, operationResult);

            // send the operation result back to the client
            logger.debug(ctx, `${fn}< 200 - result: '${JSON.stringify(operationResult)}'`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to delete the confMap '${confMapId}'`, err);
                error = new errors.FailedToDeleteConfigMapError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
