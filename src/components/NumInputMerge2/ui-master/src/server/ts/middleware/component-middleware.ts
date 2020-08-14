
import * as commonErrors from '../../../common/Errors';
import { IUIApplication } from '../../../common/model/application-model';
import { IUIRequestContext } from '../../../common/model/common-model';
import { IUIJobDefinition } from '../../../common/model/job-model';
import * as jobMapper from '../mapper/job-mapper';
import * as knativeMapper from '../mapper/knative-mapper';
import { IAccessDetails } from '../model/access-details-model';
import { IJobDefinition } from '../model/job-model';
import { IKnativeService } from '../model/knative-model';
import * as k8sjobs from '../services/k8s-jobs-service';
import * as k8sKnativeService from '../services/k8s-knative-service';
import * as helpers from './common-middleware';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:components');

const MAX_COMPONENT_COUNT = 500; // maximum number of items in the combined jobdef & application list

type IUIComponents = any[];

function addJobDefinitionsToList(regionId: string, projectId: string, list: any[], items: IJobDefinition[]) {
    items.forEach((jobDef) => {
        // convert IJobRun to IUIJobRun here and build result array with these objects
        list.push(jobMapper.mapColigoJobDefinitionToUIJobDefinition(jobDef, regionId, projectId));
    });
}

function addApplicationsToList(regionId: string, projectId: string, list: any[], items: IKnativeService[]) {
    items.forEach((app) => {
        list.push(knativeMapper.serviceToApplication(app, regionId, projectId));
    });
}

function sortByCreated(a, b) {
    return b.created - a.created;
}

function mergeJobDefsAndApps(jobDefs: IUIJobDefinition[], apps: IUIApplication[]): any[] {
    let result = [];
    let jobDefIdx = 0;
    let appIdx = 0;

    while (jobDefIdx < jobDefs.length && appIdx < apps.length) {
        if (sortByCreated(jobDefs[jobDefIdx], apps[appIdx]) > 0) {
            result.push(apps[appIdx++]);
        } else {
            result.push(jobDefs[jobDefIdx++]);
        }
    }

    if (appIdx < apps.length) {
        result = result.concat(apps.slice(appIdx));
    } else {
        result = result.concat(jobDefs.slice(jobDefIdx));
    }

    return result;
}

export function listComponents(ctx: IUIRequestContext, regionId: string, projectId: string): Promise<IUIComponents> {
    const fn = 'listComponents ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);
    const jobDefList = [];
    const appList = [];
    let jobDefContinueToken;
    let appContinueToken;
    let accessDetails;

    const countEach = Math.floor(MAX_COMPONENT_COUNT / 2);

    return helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to get the namespace config of project '${projectId}' in region '${regionId}'`, err);
                // wrap the error object in a specifc coligo error object
                error = new commonErrors.FailedToGetProjectsNamespaceConfigError(projectId, regionId, err);
            }

            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            throw error;
        })
        .then((kubeAccessDetails: IAccessDetails) => {
            accessDetails = kubeAccessDetails;
            const jobDefPromise = k8sjobs.getJobDefinitionsOfNamespace(ctx, kubeAccessDetails)
                .catch((err) => {
                    let error = err;
                    if (!(err instanceof commonErrors.GenericUIError)) {
                        logger.error(ctx, `${fn}- Failed to get the job definitions of project '${projectId}' in region '${regionId}'`, err);
                        // wrap the error object in a specifc coligo error object
                        error = new commonErrors.FailedToGetJobDefsError(err);
                    }
                    logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
                    throw error;
                })
                .then((resources) => {
                    jobDefContinueToken = resources.metadata.continue;
                    addJobDefinitionsToList(regionId, projectId, jobDefList, resources.items);
                });

            const appsPromise = k8sKnativeService.getKnServicesOfNamespace(ctx, kubeAccessDetails)
                .catch((err) => {
                    let error = err;
                    if (!(err instanceof commonErrors.GenericUIError)) {
                        logger.error(ctx, `${fn}- Failed to get the knative services of project '${projectId}' in region '${regionId}'`, err);
                        // wrap the error object in a specifc coligo error object
                        error = new commonErrors.FailedToGetApplicationsError(err);
                    }
                    logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
                    throw error;
                })
                .then((resources) => {
                    appContinueToken = resources.metadata.continue;
                    addApplicationsToList(regionId, projectId, appList, resources.items);
                });

            return Promise.all([jobDefPromise, appsPromise]);
        })
        .then(() => {
           // after the first round of getting jobdefinitions & applications, we check the number of results we received
           // to determine whether we have to run a second call on each of the resource types

            if (jobDefList.length < countEach) {
                if ((appList.length >= countEach) && jobDefContinueToken) {
                    return k8sjobs.getJobDefinitionsOfNamespace(ctx, accessDetails,
                        {
                            continueToken: jobDefContinueToken,
                            limit: countEach - jobDefList.length,
                        })
                        .then((resources) => {
                            addJobDefinitionsToList(regionId, projectId, jobDefList, resources.items);
                        });
                } // else: maxed out already -> nothing to do
            } else {
                if ((appList.length < countEach) && appContinueToken) {
                    return k8sKnativeService.getKnServicesOfNamespace(ctx, accessDetails,
                        {
                            continueToken: appContinueToken,
                            limit: countEach - appList.length,
                        })
                        .then((resources) => {
                            addApplicationsToList(regionId, projectId, appList, resources.items);
                        });
                }
            } // else: retrieved the maximum of both already -> nothing to do
        })
        .then(() => {
           // both lists are now fully filled (and won't exceed the MAX_COUNT when added up together)
           // we can now perform a merge-sort of the two lists to efficiently merge the two lists and get an already
           // sorted output list
           const mergedList = mergeJobDefsAndApps(jobDefList, appList);
           logger.debug(ctx, `${fn}< ${mergedList && mergedList.length} components`);
           return mergedList;
        });
}
