import { GenericUIError } from '../../../common/Errors';
import * as errors from './../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import * as jobModel from '../../../common/model/job-model';
import * as jobs from '../middleware/job-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'jobs';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

/* **** --------------- **** */
/* **** JOBDEF DEFINITIONS **** */
/* ****    (INTERNAL)   **** */
/* **** =============== **** */

export function getJobDefinition(req, res): void {
    const fn = 'getJobDefinition ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobDefName: string = req.params.jobdefinitionId;

    jobs.getJobDefinition(ctx, regionId, projectId, jobDefName)
        .then((jobDefinition: jobModel.IUIJobDefinition) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, jobDefinition);
            logger.debug(ctx, `${fn}< 200 - jobdef: '${jobDefinition.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve jobdef '${jobDefName}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetJobDefError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listJobDefinitions(req, res): void {
    const fn = 'listJobDefinitions ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    jobs.listJobDefinitions(ctx, regionId, projectId)
        .then((list: jobModel.IUIJobDefinitions) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            logger.debug(ctx, `${fn}< 200 - ${ list ? list.length : 'NULL' } jobdefs - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve job definitions of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetJobDefsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function createJobDefinition(req, res): void {
    const fn = 'createJobDefinition ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobDefData = req.body || {};

    logger.debug(ctx, `${fn}- regionId: ${regionId}, projectId: '${projectId}', jobDefData: ${JSON.stringify(jobDefData)}`);

    jobs.createJobDefinition(ctx, regionId, projectId, jobDefData)
        .then((jobDef: jobModel.IUIJobDefinition) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, jobDef);
            logger.debug(ctx, `${fn}< 201 - jobdef name: '${jobDef.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the jobdef '${JSON.stringify(jobDefData)}'`, err);
                error = new errors.FailedToCreateJobDefError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteJobDefinition(req, res): void {
    const fn = 'deleteJobDefinition ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobDefName: string = req.params.jobdefinitionId;

    jobs.deleteJobDefinition(ctx, regionId, projectId, jobDefName)
        .then(() => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK);

            // send the operation result back to the client
            logger.debug(ctx, `${fn}< 200 - result: '${JSON.stringify(result)}'`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to delete the jobdef '${jobDefName}'`, err);
                error = new errors.FailedToDeleteJobDefError(jobDefName, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function updateJobDefinition(req, res): void {
    const fn = 'updateJobDefinition ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobDefData = req.body || {};

    jobs.updateJobDefinition(ctx, regionId, projectId, jobDefData)
        .then((jobDef: jobModel.IUIJobDefinition) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, jobDef);
            logger.debug(ctx, `${fn}< 200 - jobdef name: '${jobDef.name}'`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to update the jobdef '${JSON.stringify(jobDefData)}'`, err);
                error = new errors.FailedToUpdateJobDefError(jobDefData && jobDefData.name, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

/* **** ---------- **** */
/* ****  JOB RUNS  **** */
/* **** (INTERNAL) **** */
/* **** ========== **** */

export function createJobRun(req, res): void {
    const fn = 'createJobRun ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobRunData = req.body || {};

    logger.debug(ctx, `createJobRun - jobRunData: ${JSON.stringify(jobRunData)}`);

    jobs.createJobRun(ctx, regionId, projectId, jobRunData)
        .then((jobRun) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, jobRun);
            logger.debug(ctx, `${fn}< 201 - jobrun name: '${jobRun.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the jobrun '${JSON.stringify(jobRunData)}'`, err);
                error = new errors.FailedToCreateJobRunError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getJobRun(req, res): void {
    const fn = 'getJobRun ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobRunName: string = req.params.jobrun;

    jobs.getJobRun(ctx, regionId, projectId, jobRunName)
        .then((jobRun: jobModel.IUIJobRun) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, jobRun);
            logger.debug(ctx, `${fn}< 200 - jobrun: '${jobRun.name}' - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err: GenericUIError) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve jobrun '${jobRunName}' from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetJobRunError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listJobRuns(req, res): void {
    const fn = 'listJobRuns ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobDefinitionName: string = req.query.jobDefinitionName;

    jobs.listJobRuns(ctx, regionId, projectId, jobDefinitionName)
        .then((list: jobModel.IUIJobRuns) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            logger.debug(ctx, `${fn}< 200 - ${ list ? list.length : 'NULL' } jobruns - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve job runs of project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetJobRunsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listJobRunInstancesInternal(req, res): void {
    const ctx = getClgContext(req);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobRunName: string = req.params.jobrun;

    jobs.listJobRunInstances(ctx, regionId, projectId, jobRunName)
        .then((list: jobModel.IUIJobRunInstances) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            res.status(200).send(result);
        })
        .catch((error: GenericUIError) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.FAILED, error);
            res.status(400).send(result);
        });
}

export function deleteJobRun(req, res): void {
    const fn = 'deleteJobRun ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;
    const jobRunName = req.params.jobrun;

    jobs.deleteJobRun(ctx, regionId, projectId, jobRunName)
        .then(() => {
            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK);
            // send the operation result back to the client
            logger.debug(ctx, `${fn}< 200`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to delete the jobrun '${jobRunName}'`, err);
                error = new errors.FailedToDeleteJobRunError(jobRunName, err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
