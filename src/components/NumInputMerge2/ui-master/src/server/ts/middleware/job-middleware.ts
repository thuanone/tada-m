import { IUIRequestContext, UIEntityKinds } from '../../../common/model/common-model';
import {
    IUIJobDefinition,
    IUIJobDefinitions,
    IUIJobRun, IUIJobRunInstance,
    IUIJobRunInstances,
    IUIJobRuns
} from '../../../common/model/job-model';
import * as jobMapper from '../mapper/job-mapper';
import { IAccessDetails } from '../model/access-details-model';
import { IJobDefinition, IJobDefinitions, IJobRun } from '../model/job-model';
import * as k8sjobs from '../services/k8s-jobs-service';
import * as commonErrors from './../../../common/Errors';
import * as helpers from './common-middleware';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:jobs');

/* **** --------------- **** */
/* **** JOBDEF DEFINITIONS **** */
/* **** =============== **** */

export function createJobDefinition(ctx: IUIRequestContext, regionId: string, projectId: string, uiJobDef: IUIJobDefinition): Promise<IUIJobDefinition> {
    const fn = 'createJobDefinition ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', uiJobDef: '${uiJobDef}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            const jobDef: IJobDefinition = jobMapper.mapUIJobDefinitionToColigoJobDefinition(uiJobDef);
            return k8sjobs.createJobDefinitionInNamespace(ctx, kubeAccessDetails, jobDef);
        })
        .then((jobDef: IJobDefinition) => {
            const result: IUIJobDefinition = jobMapper.mapColigoJobDefinitionToUIJobDefinition(jobDef, regionId, projectId);

            logger.debug(ctx, `${fn}<`);
            return result;
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to create the jobdefinition in region '${regionId}' and project '${projectId}'`, err);
                // wrap the error object in a specifc coligo error object
                error = new commonErrors.FailedToCreateJobDefError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

export function getJobDefinition(ctx: IUIRequestContext, regionId: string, projectId: string, jobDefName: string): Promise<IUIJobDefinition> {
    const fn = 'getJobDefinition ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', jobDefName: '${jobDefName}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            return k8sjobs.getJobDefinitionOfNamespace(ctx, kubeAccessDetails, jobDefName);
        })
        .then((jobDef: IJobDefinition) => {
            let result: IUIJobDefinition;
            result = jobMapper.mapColigoJobDefinitionToUIJobDefinition(jobDef, regionId, projectId);
            logger.debug(ctx, `${fn}<`);
            return result;
        })
        .catch((err) => {
          let error = err;
          if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to get the jobdefinition '${jobDefName}' in region '${regionId}' and project '${projectId}'`, err);
            // wrap the error object in a specifc coligo error object
            error = new commonErrors.FailedToGetJobDefError(err);
          }

          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
          throw error;
        });
}

export function listJobDefinitions(ctx: IUIRequestContext, regionId: string, projectId: string): Promise<IUIJobDefinitions> {
    const fn = 'listJobDefinitions ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            return k8sjobs.getJobDefinitionsOfNamespace(ctx, kubeAccessDetails);
        })
        .then((jobDefs: IJobDefinitions) => {
            const jobRuns: IJobDefinition[] = jobDefs.items;
            const result = [];
            jobRuns.forEach((jobDef) => {
                // convert IJobRun to IUIJobRun here and build result array with these objects
                result.push(jobMapper.mapColigoJobDefinitionToUIJobDefinition(jobDef, regionId, projectId));
            });
            logger.debug(ctx, `${fn}< ${result ? result.length : 'NULL'} jobdefinitions`);
            return result as IUIJobDefinition[];
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to get the jobdefinitions in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToGetJobDefsError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

export function deleteJobDefinition(ctx: IUIRequestContext, regionId: string, projectId: string, jobDefName: string): Promise<any> {
    const fn = 'deleteJobDefinition ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', jobDefName: '${jobDefName}'`);
    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            return k8sjobs.deleteJobDefinitionInNamespace(ctx, kubeAccessDetails, jobDefName);
        })
        .then((deletionResult) => {
            logger.debug(ctx, `${fn}< ${JSON.stringify(deletionResult)}`);
            return deletionResult;
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to delete the jobdefinition '${jobDefName}' in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToDeleteJobDefError(jobDefName, err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

export function updateJobDefinition(ctx: IUIRequestContext, regionId: string, projectId: string, uiJobDef: IUIJobDefinition): Promise<IUIJobDefinition> {
    const fn = 'updateJobDefinition ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', uiJobDef: '${uiJobDef}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            const jobDef: IJobDefinition = jobMapper.mapUIJobDefinitionToColigoJobDefinition(uiJobDef);

            return k8sjobs.updateJobDefinitionInNamespace(ctx, kubeAccessDetails, jobDef);
        })
        .then((jobDef: IJobDefinition) => {
            const result: IUIJobDefinition = jobMapper.mapColigoJobDefinitionToUIJobDefinition(jobDef, regionId, projectId);
            logger.debug(ctx, `${fn}<`);
            return result;
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to update the jobdefinition in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToUpdateJobDefError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

/* **** -------- **** */
/* **** JOBDEF RUNS **** */
/* **** ======== **** */

export function createJobRun(ctx: IUIRequestContext, regionId: string, projectId: string, uiJobRun: IUIJobRun): Promise<IUIJobRun> {
    const fn = 'createJobRun ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', uiJobRun: '${uiJobRun}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            const jobRun: IJobRun = jobMapper.mapUIJobRunToColigoJobRun(uiJobRun);
            return k8sjobs.createJobRunInNamespace(ctx, kubeAccessDetails, jobRun);
        })
        .then((jobRun: IJobRun) => {
            const result: IUIJobRun = jobMapper.mapColigoJobRunToUIJobRun(jobRun, regionId, projectId);
            logger.debug(ctx, `${fn}<`);
            return result;
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to create the jobrun in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToCreateJobRunError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

export function getJobRun(ctx: IUIRequestContext, regionId: string, projectId: string, jobRunName: string): Promise<IUIJobRun> {
    const fn = 'getJobRun ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', jobRunName: '${jobRunName}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            return k8sjobs.getJobRunOfNamespace(ctx, kubeAccessDetails, jobRunName);
        })
        .then((jobRun: IJobRun) => {
            const result: IUIJobRun = jobMapper.mapColigoJobRunToUIJobRun(jobRun, regionId, projectId);
            logger.debug(ctx, `${fn}<`);
            return result;
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to get the jobrun '${jobRunName}' in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToGetJobRunError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

export function listJobRuns(ctx: IUIRequestContext, regionId: string, projectId: string, jobDefinitionName?: string): Promise<IUIJobRuns> {
    const fn = 'listJobRuns ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', jobDefinitionName: '${jobDefinitionName}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            return k8sjobs.getJobRunsOfNamespace(ctx, kubeAccessDetails, jobDefinitionName);
        })
        .then((jobRuns: IJobRun[]) => {
            const result = [];
            jobRuns.forEach((jobRun) => {
                // convert IJobRun to IUIJobRun here and build result array with these objects
                result.push(jobMapper.mapColigoJobRunToUIJobRun(jobRun, regionId, projectId));
            });
            logger.debug(ctx, `${fn}< ${result && result.length} jobruns`);
            return result as IUIJobRun[];
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to get the jobruns of '${jobDefinitionName}' in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToGetJobRunsError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}

export function getJobRunInstance(ctx: IUIRequestContext, regionId: string, projectId: string, jobRunName: string): Promise<IUIJobRunInstance> {
    return Promise.resolve({ id: 'foo', kind: UIEntityKinds.JOBRUNINSTANCE, name: 'bar', completed: 0 });
}

export function listJobRunInstances(ctx: IUIRequestContext, regionId: string, projectId: string, jobRunName: string): Promise<IUIJobRunInstances> {
    return Promise.resolve([{ id: 'foo', kind: UIEntityKinds.JOBRUNINSTANCE, name: 'bar', completed: 0 }]);
}

/**
 * Returned promise rejects with a FailedToDeleteJobRunError or just resolves without parameters.
 *
 */
export function deleteJobRun(ctx: IUIRequestContext, regionId: string, projectId: string, jobRunName: string): Promise<any> {
    const fn = 'deleteJobRun ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', jobRunName: '${jobRunName}'`);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .then((kubeAccessDetails: IAccessDetails) => {
            return k8sjobs.deleteJobRunInNamespace(ctx, kubeAccessDetails, jobRunName);
        }).then((deletionResult) => {
            logger.debug(ctx, `${fn}< ${JSON.stringify(deletionResult)}`);
            return deletionResult;
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
              logger.error(ctx, `${fn}- Failed to delete the jobrun '${jobRunName}' in region '${regionId}' and project '${projectId}'`, err);
              // wrap the error object in a specifc coligo error object
              error = new commonErrors.FailedToDeleteJobRunError(err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        });
}
