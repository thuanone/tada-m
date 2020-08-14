import * as errors from '../../../common/Errors';

import * as commonBuildModel from '../../../common/model/build-model';
import * as commonModel from '../../../common/model/common-model';
import * as buildMiddelware from '../middleware/build-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'build';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function createBuild(req, res): void {
    const fn = 'createBuild ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildToCreate: commonBuildModel.IUIBuild = req.body;

    // delegate the build creation to the build middleware
    buildMiddelware.createBuild(ctx, regionId, projectId, buildToCreate)
        .then( (createdBuild) => {

            // TODO check whether the build could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdBuild);

            // send the created build back to the client
            logger.debug(ctx, `${fn}< 201 - build name: '${createdBuild.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the build '${commonBuildModel.stringify(buildToCreate)}'`, err);
                error = new errors.FailedToCreateBuildError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listBuilds(req, res): void {
    const fn = 'listBuilds ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the build of a specific project
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    buildMiddelware.listBuilds(ctx, regionId, projectId)
        .then((builds: commonBuildModel.IUIBuild[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, builds);
            logger.debug(ctx, `${fn}< 200 - ${ builds ? builds.length : 'NULL' } builds - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve builds of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetBuildsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getBuild(req, res): void {
    const fn = 'getBuild ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the specific build
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildId: string = req.params.buildId;

    buildMiddelware.getBuild(ctx, regionId, projectId, buildId)
        .then((build: commonBuildModel.IUIBuild) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, build);
            logger.debug(ctx, `${fn}< 200 - build: '${build.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve build '${buildId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetBuildError(buildId, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function updateBuild(req, res): void {
    const fn = 'updateBuild ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildId: string = req.params.buildId;
    const buildData = req.body || {};

    buildMiddelware.updateBuild(ctx, regionId, projectId, buildId, buildData)
        .then((build: commonBuildModel.IUIBuild) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, build);
            logger.debug(ctx, `${fn}< 200 - build name: '${build.name}'`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to update the build '${JSON.stringify(buildData)}'`, err);
                error = new errors.FailedToUpdateJobDefError(buildData && buildData.name, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteBuild(req, res): void {
    const fn = 'deleteBuild ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildId: string = req.params.buildId;

    // delete the build
    buildMiddelware.deleteBuild(ctx, regionId, projectId, buildId)
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
                logger.error(ctx, `${fn}- Failed to delete the build '${buildId}'`, err);
                error = new errors.FailedToDeleteBuildError(buildId, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

// =============================================
// BuildRun
// =============================================

export function createBuildRun(req, res): void {
    const fn = 'createBuildRun ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildRunToCreate: commonBuildModel.IUIBuildRun = req.body;

    // delegate the buildRun creation to the build middleware
    buildMiddelware.createBuildRun(ctx, regionId, projectId, buildRunToCreate)
        .then( (createdBuildRun) => {

            // TODO check whether the build could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdBuildRun);

            // send the created buildRun back to the client
            logger.debug(ctx, `${fn}< 201 - buildRun name: '${createdBuildRun.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the buildRun '${commonBuildModel.stringify(buildRunToCreate)}'`, err);
                error = new errors.FailedToCreateBuildRunError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listBuildRuns(req, res): void {
    const fn = 'listBuildRuns ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the build of a specific project
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildId: string = req.params.buildId;

    buildMiddelware.listBuildRuns(ctx, regionId, projectId, buildId)
        .then((buildRuns: commonBuildModel.IUIBuildRun[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, buildRuns);
            logger.debug(ctx, `${fn}< 200 - ${ buildRuns ? buildRuns.length : 'NULL' } buildRuns - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve buildRuns of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetBuildRunsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getBuildRun(req, res): void {
    const fn = 'getBuildRun ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve the specific build
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildRunId: string = req.params.buildRunId;

    buildMiddelware.getBuildRun(ctx, regionId, projectId, buildRunId)
        .then((buildRun: commonBuildModel.IUIBuildRun) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, buildRun);
            logger.debug(ctx, `${fn}< 200 - build: '${buildRun.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve buildRun '${buildRunId}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetBuildRunError(buildRunId, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteBuildRun(req, res): void {
    const fn = 'deleteBuildRun ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const buildRunId: string = req.params.buildRunId;

    // delete the build
    buildMiddelware.deleteBuildRun(ctx, regionId, projectId, buildRunId)
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
                logger.error(ctx, `${fn}- Failed to delete the buildRun '${buildRunId}'`, err);
                error = new errors.FailedToDeleteBuildRunError(buildRunId, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
