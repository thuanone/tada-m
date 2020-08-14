import * as errors from './../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import * as projectModel from '../../../common/model/project-model';
import * as projects from '../middleware/project-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';
import * as commonErrors from './../../../common/Errors';

const COMPONENT = 'project';

import * as loggerUtil from '../utils/logger-utils';
import { IUIProjects } from '../../../common/model/project-model';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function createProject(req, res): void {
    const fn = 'createProject ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const projectToCreate: projectModel.IUIProject = req.body;

    // delegate the project creation to the project middleware
    projects.createProject(ctx, projectToCreate)
        .then((createdProject) => {

            // TODO check whether the project could be created properly!

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, createdProject);

            // send the created project back to the client
            logger.debug(ctx, `${fn}< 201 - project name: '${createdProject.name}'`);
            res.status(201).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the project '${JSON.stringify(projectToCreate)}'`, err);
                error = new errors.FailedToCreateProjectError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getAllProjects(req, res) {
    const fn = 'getAllProjects ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    projects.listProjects(ctx).then((projectsResults: IUIProjects) => {
        const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, projectsResults);
        logger.debug(ctx, `${fn}< 200 - projects ${projectsResults ? projectsResults : 'NULL'} - duration: ${result.duration}ms`);
        res.status(200).send(result);
    });
}

export function getProject(req, res): void {
    const fn = 'getProject ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    projects.getProject(ctx, projectId, regionId)
        .then((project: projectModel.IUIProject) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, project);
            logger.debug(ctx, `${fn}< 200 - project ${project ? project.name : 'NULL'} - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve project '${projectId}' of region '${regionId}'`, err);
                error = new commonErrors.FailedToGetProjectError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getProjectStatus(req, res): void {
    const fn = 'getProjectStatus ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    projects.getProjectStatus(ctx, projectId, regionId)
        .then((projectStatus: projectModel.IUIProjectStatus) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, projectStatus);
            logger.debug(ctx, `${fn}< 200 - project status ${JSON.stringify(projectStatus)} - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve the status of project '${projectId}' of region '${regionId}'`, err);
                error = new commonErrors.FailedToGetProjectStatusError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getProjectConsumption(req, res): void {
    const fn = 'getProjectConsumption ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    projects.getProjectConsumptionInfo(ctx, regionId, projectId)
        .then((projectConsumptionInfo: projectModel.IUIProjectConsumptionInfo) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, projectConsumptionInfo);
            logger.debug(ctx, `${fn}< 200 - ${JSON.stringify(projectConsumptionInfo && projectConsumptionInfo.totalNumberOfInstances)} pod instances in project - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve the consumption info of project '${projectId}' of region '${regionId}'`, err);
                error = new commonErrors.FailedToGetProjectConsumptionInfoError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listProjects(req, res): void {
    const fn = 'listProjects ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;

    projects.listProjects(ctx, regionId)
        .then((list: projectModel.IUIProjects) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            logger.debug(ctx, `${fn}< 200 - ${list ? list.length : 'NULL'} projects - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve projects of region '${regionId}'`, err);
                error = new commonErrors.FailedToGetProjectsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listResourceGroups(req, res): void {
    const fn = 'listResourceGroups ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    projects.listResourceGroups(ctx)
        .then((list: projectModel.IUIResourceGroups) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            logger.debug(ctx, `${fn}< 200 - ${list ? list.length : 'NULL'} resource groups - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve resource groups`, err);
                error = new commonErrors.FailedToGetResourceGroupsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function listRegions(req, res): void {
    const fn = 'listRegions ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    projects.listRegions(ctx)
        .then((list: projectModel.IUIRegions) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            logger.debug(ctx, `${fn}< 200 - ${list ? list.length : 'NULL'} regions - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve regions`, err);
                error = new commonErrors.FailedToGetRegionsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function deleteProject(req, res): void {
    const fn = 'deleteProject ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const projectId: string = req.params.projectId;

    // delete the application
    projects.deleteProject(ctx, projectId)
        .then((operationResult: commonModel.IUIOperationResult) => {

            // create the result object
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, operationResult);

            // send the operation result back to the client
            logger.debug(`${fn}< 200 - result: '${JSON.stringify(operationResult)}'`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(`${fn}- Failed to delete the project '${projectId}'`, err);
                error = new errors.FailedToDeleteProjectError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(`${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
