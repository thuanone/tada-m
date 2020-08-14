import * as errors from './../../../common/Errors';

import * as appModel from '../../../common/model/application-model';
import * as commonModel from '../../../common/model/common-model';
import * as apps from '../middleware/application-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'application';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function createApplication(req, res): void {
    const fn = 'createApplication ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicatonToCreate: appModel.IUIApplication = req.body;

    // delegate the application creation to the application middleware
    apps.createApplication(ctx, regionId, projectId, applicatonToCreate)
        .then( (createdApplication) => {

            // TODO check whether the application could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdApplication);

            // send the created application back to the client
            logger.debug(ctx, `${fn}< 201 - application name: '${createdApplication.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the application '${JSON.stringify(applicatonToCreate)}'`, err);
                error = new errors.FailedToCreateApplicationError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function createApplicationRevision(req, res): void {
    const fn = 'createApplicationRevision ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;
    const revisionToCreate: appModel.IUIApplicationRevision = req.body;

    apps.createApplicationRevision(ctx, regionId, projectId, applicationId, revisionToCreate)
        .then( (createdRevision) => {

            // TODO check whether the revision could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdRevision);

            // send the created revision back to the client
            logger.debug(ctx, `${fn}< 201 - revision name: '${createdRevision.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the revision '${JSON.stringify(revisionToCreate)}'`, err);
                error = new errors.FailedToCreateApplicationRevisionError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listApplications(req, res): void {
    const fn = 'listApplications ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the applications of a specific project
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    apps.listApplications(ctx, regionId, projectId)
        .then((applications: appModel.IUIApplication[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, applications);
            logger.debug(ctx, `${fn}< 200 - ${ applications ? applications.length : 'NULL' } applications - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve applications of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetApplicationsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getApplication(req, res): void {
    const fn = 'getApplication ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the specific application
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;

    apps.getApplication(ctx, regionId, projectId, applicationId)
        .then((application: appModel.IUIApplication) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, application);
            logger.debug(ctx, `${fn}< 200 - application: '${application.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve application '${applicationId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetApplicationError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getApplicationRoute(req, res): void {
    const fn = 'getApplicationRoute ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the specific application
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;

    apps.getApplicationRoute(ctx, regionId, projectId, applicationId)
        .then((route: appModel.IUIApplicationRoute) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, route);
            logger.debug(ctx, `${fn}< 200 - route: '${route}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve route of application '${applicationId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetApplicationRouteError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listApplicationRevisions(req, res): void {
    const fn = 'listApplicationRevisions ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the revisions of a specific application
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;

    apps.listApplicationRevisions(ctx, regionId, projectId, applicationId)
        .then((revisions: appModel.IUIApplicationRevision[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, revisions);
            logger.debug(ctx, `${fn}< 200 - ${ revisions ? revisions.length : 'NULL' } revisions - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve revisions of application '${applicationId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetApplicationRevisionsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listApplicationInstances(req, res): void {
    const fn = 'listApplicationInstances ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the instances (=pods) of a specific application
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;

    apps.listApplicationInstances(ctx, regionId, projectId, applicationId)
        .then((instances: appModel.IUIApplicationInstance[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, instances);
            logger.debug(ctx, `${fn}< 200 - ${ instances ? instances.length : 'NULL' } instances - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve instances of application '${applicationId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetApplicationInstancesError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteApplication(req, res): void {
    const fn = 'deleteApplication ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;

    // delete the application
    apps.deleteApplication(ctx, regionId, projectId, applicationId)
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
                logger.error(ctx, `${fn}- Failed to delete the application '${applicationId}'`, err);
                error = new errors.FailedToDeleteApplicationError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function invokeApplication(req, res): void {
    const fn = 'invokeApplication ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const applicationId: string = req.params.applicationId;
    const invocationPayload: appModel.IUIApplicationInvocation = req.body;

    apps.invokeApplication(ctx, regionId, projectId, applicationId, invocationPayload)
        .then( (invocationResult: appModel.IUIApplicationInvocationResult) => {

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, invocationResult);

            // send the invocation result back to the client
            logger.debug(ctx, `${fn}< 200`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to invoke the application '${applicationId}' with '${JSON.stringify(invocationPayload)}'`, err);
                error = new errors.FailedToInvokeApplicationError(err);
            }

            // re-use the original code, but do not send 403 (as this would cause a logout on the client-side)
            const statusCode = err.statusCode && err.statusCode !== 403 ? err.statusCode : 400;

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), statusCode, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
