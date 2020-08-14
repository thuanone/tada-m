import * as errors from '../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import * as configModel from '../../../common/model/config-model';
import * as secretsMiddelware from '../middleware/secret-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'secret';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function createSecret(req, res): void {
    const fn = 'createSecret ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const secretToCreate: configModel.IUISecret = req.body;

    // delegate the secret creation to the secrets middleware
    secretsMiddelware.createSecret(ctx, regionId, projectId, secretToCreate)
        .then( (createdSecret) => {

            // TODO check whether the secret could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdSecret);

            // send the created secret back to the client
            logger.debug(ctx, `${fn}< 201 - secret name: '${createdSecret.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the secret '${configModel.stringify(secretToCreate)}'`, err);
                error = new errors.FailedToCreateSecretError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listSecrets(req, res): void {
    const fn = 'listSecrets ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the secrets of a specific project
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const secretType: string = req.query.secretType;

    secretsMiddelware.listSecrets(ctx, regionId, projectId, secretType)
        .then((secrets: configModel.IUISecret[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, secrets);
            logger.debug(ctx, `${fn}< 200 - ${ secrets ? secrets.length : 'NULL' } secrets - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve secrets of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetSecretsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getSecret(req, res): void {
    const fn = 'getSecret ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the specific secret
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const secretId: string = req.params.secretId;
    const headers = req.headers;

    const includeCredentials = !!headers['x-ce-include-credentials'];

    logger.debug(ctx, `${fn} includeCredentials = ${includeCredentials}`);

    secretsMiddelware.getSecret(ctx, regionId, projectId, secretId, includeCredentials)
        .then((secret: configModel.IUISecret) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, secret);
            logger.debug(ctx, `${fn}< 200 - secret: '${secret.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve secret '${secretId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetSecretError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteSecret(req, res): void {
    const fn = 'deleteSecret ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const secretId: string = req.params.secretId;

    // delete the secret
    secretsMiddelware.deleteSecret(ctx, regionId, projectId, secretId)
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
                logger.error(ctx, `${fn}- Failed to delete the secret '${secretId}'`, err);
                error = new errors.FailedToDeleteSecretError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
