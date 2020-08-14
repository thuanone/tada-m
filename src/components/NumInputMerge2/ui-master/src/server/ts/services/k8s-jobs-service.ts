/**
 * Provides methods for interacting with the coligo batch jobrun resource type.
 *
 */

import * as resiliency from '@console/console-platform-resiliency';

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as accessDetailsModel from '../model/access-details-model';
import { COLIGO_JOBS_API_GROUP, COLIGO_JOBS_API_VERSION, IJobDefinition, IJobDefinitions, IJobRun, IJobRuns } from '../model/job-model';  // model for data from backend
import { IKubernetesQueryParameters, IKubernetesStatus, IResourceStats } from '../model/k8s-model';
import * as monitoringModel from '../model/monitoring-model';
import * as httpUtils from '../utils/http-utils';
import * as monitorUtils from '../utils/monitoring-utils';

const COMP_NAME = 'k8s-jobs';
import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

/**
 * Get the creation timestamp of a Job Definition or Job Instance from it's metadata field
 * @param job
 */
function getJobTimestamp(job: IJobRun | IJobDefinition) {
    let result = (job.metadata && job.metadata.creationTimestamp) ? Date.parse(job.metadata.creationTimestamp) : -1;
    if (isNaN(result)) {
        // could not parse date -> treat as if no date was set in the first place
        result = -1;
    }

    return result;
}

function compareJobs(jobA: IJobRun | IJobDefinition, jobB: IJobRun | IJobDefinition) {
    const timeA = getJobTimestamp(jobA);
    const timeB = getJobTimestamp(jobB);

    return timeB - timeA;
}

function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken: string, contentType?: string) {
    return Object.assign({
        'Accept': 'application/json',
        'Content-Type': contentType || 'application/json',
        'cache-control': 'max-age=0, no-cache, no-store',
    }, httpUtils.getCommonHeaders(ctx, accessToken));
}

/* **** --------------- **** */
/* **** JOBDEF DEFINITIONS **** */
/* **** =============== **** */

export function createJobDefinitionInNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobDefinition: IJobDefinition) {
    const fn = 'createJobDefinitionInNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobDefinition: '${jobDefinition}'`);

    // input check
    if (!jobDefinition) {
        const errorMsg = 'jobDefinition must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToCreateJobDefError(new Error(errorMsg)));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::createJobDefinitionInNamespace`,
    };

    // make sure that apiVersion / kind are properly set
    if (jobDefinition) {
        jobDefinition.apiVersion = `${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}`;
        jobDefinition.kind = 'JobDefinition';
    }

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            data: jobDefinition,
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'POST',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobdefinitions`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const jobDef: IJobDefinition = httpUtils.safeJSONParse(ctx, body);
                logger.trace(ctx, `${fn}- created jobDef: ${JSON.stringify(jobDef)}`);

                logger.debug(ctx, `${fn}<`);
                return resolve(jobDef);
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                let errorToReject = error;
                if (!(error instanceof commonErrors.GenericUIError)) {
                    logger.error(ctx, `Error creating job definition in namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path}`, error);

                    // wrap the error object in a specifc coligo error object
                    if (error.reason === 'AlreadyExists') {
                        errorToReject = new commonErrors.FailedToCreateJobDefBecauseAlreadyExistsError(error);
                    } else {
                        errorToReject = new commonErrors.FailedToCreateJobDefError(error);
                    }
                }

                logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(errorToReject)}`);
                reject(errorToReject);
            }
        });
    });
}

export function getJobDefinitionOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobDefinitionName: string): Promise<IJobDefinition> {
    const fn = 'getJobDefinitionOfNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobDefinitionName: '${jobDefinitionName}'`);

    // input check
    if (!jobDefinitionName) {
        const errorMsg = 'jobDefinitionName must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToGetJobDefError(new Error(errorMsg)));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::getJobDefinitionOfNamespace`,
    };

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'GET',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobdefinitions/${jobDefinitionName}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const jobDef: IJobDefinition = httpUtils.safeJSONParse(ctx, body);
                logger.trace(ctx, `${fn}- jobDef: ${JSON.stringify(jobDef)}`);

                logger.debug(ctx, `${fn}<`);
                return resolve(jobDef);
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error getting job definition of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToGetJobDefError(new Error(errMessage)));
            }
        });
    });
}

export function getNumberOfJobDefinitions(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<IResourceStats> {
    const fn = 'getNumberOfJobDefinitions ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);
    return getJobDefinitionsOfNamespace(ctx, accessDetails)
        .then((resources) => {
            const numberOfItems = resources && resources.items && resources.items.length || 0;
            logger.debug(ctx, `${fn}< ${numberOfItems} job definitions`);
            return { id: commonModel.UIEntityKinds.JOBDEFINITION, count: numberOfItems };
        })
        .catch((err) => {
            logger.debug(ctx, `${fn}< 0 - due to an ERR`);
            return { id: commonModel.UIEntityKinds.JOBDEFINITION, count: 0 };
        });
}

export function getJobDefinitionsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: IKubernetesQueryParameters): Promise<IJobDefinitions> {
    const fn = 'getJobDefinitionsOfNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', queryParameters: ${JSON.stringify(queryParameters)}`);

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::getJobDefinitionsOfNamespace`,
    };

    const limit = (queryParameters && queryParameters.limit) ? queryParameters.limit : 500;

    let urlParams = `?limit=${limit}`;

    if (queryParameters && queryParameters.labelSelector) {
        urlParams += `&labelSelector=${encodeURIComponent(queryParameters.labelSelector)}`;
    }

    if (queryParameters && queryParameters.continueToken) {
        urlParams += `&continue=${queryParameters.continueToken}`;  // token already encoded!
    }

    // we use urlParams as a variable here to be extensible in the future, when more query params might be added

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'GET',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobdefinitions${urlParams}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                try {
                    const jobDefs: IJobDefinitions = httpUtils.safeJSONParse(ctx, body);

                    logger.trace(ctx, `${fn}- jobDefsList: ${JSON.stringify(jobDefs)}`);

                    // check whether resources list is of kind 'ServiceList' or 'RevisionList'
                    // TODO paging -> https://kubernetes.io/docs/reference/using-api/api-concepts/#retrieving-large-results-sets-in-chunks

                    if (jobDefs.items && jobDefs.items.length > 0) {
                        // sort the resource by creation date
                        logger.debug(ctx, `${fn}< Retrieved ${jobDefs.items.length} 'JobDefinitions'`);

                        jobDefs.items.sort(compareJobs);

                        return resolve(jobDefs);
                    } else {
                        logger.debug(ctx, `${fn}< EMPTY list`);
                        return resolve({ items: [], metadata: {} } as IJobDefinitions);
                    }
                } catch (err) {
                    const errMessage = `failed to convert response.body to JSON - URL: ${options.urls}${options.path} - status: ${response && response.statusCode} - error: ${err.message}`;
                    logger.warn(ctx, `${fn}- ${errMessage}`);
                    logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
                    return reject(new commonErrors.FailedToGetJobDefsError(new Error(errMessage)));
                }
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error getting job definitions of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToGetJobDefsError(new Error(errMessage)));
            }
        });
    });
}

export function deleteJobDefinitionInNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobDefinitionName: string): Promise<any> {
    const fn = 'deleteJobDefinitionInNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobDefinitionName: '${jobDefinitionName}'`);

    // input check
    if (!jobDefinitionName) {
        const errorMsg = 'jobDefinitionName must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToDeleteJobDefError(undefined, new Error(errorMsg)));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::deleteJobDefinitionInNamespace`,
    };

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'DELETE',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobdefinitions/${jobDefinitionName}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const opStatus: IKubernetesStatus = httpUtils.safeJSONParse(ctx, body);
                logger.trace(ctx, `${fn}- delete operation status: ${JSON.stringify(opStatus)}`);

                // verify that the deletions was successful, based on the values in the returned status object
                if ((opStatus.kind !== 'Status') ||
                    (opStatus.status !== 'Success')) {
                    logger.debug(ctx, `${fn}< DELETION FAILED - ${JSON.stringify(opStatus)}`);
                    return reject(new commonErrors.FailedToDeleteJobDefError(jobDefinitionName));
                } else {
                    logger.debug(ctx, `${fn}< ${JSON.stringify(opStatus)}`);
                    return resolve(opStatus);
                }
            } else {
                // set the HTTP status currentValues into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error deleting job definition '${jobDefinitionName}' of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToDeleteJobDefError(jobDefinitionName, new Error(errMessage)));
            }
        });
    });
}

export function updateJobDefinitionInNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobDefinition: IJobDefinition): Promise<IJobDefinition> {
    const fn = 'updateJobDefinitionInNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobDefinition: '${jobDefinition}'`);

    // input check
    if (!jobDefinition) {
        const errorMsg = 'jobDefinitionName must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToUpdateJobDefError(undefined, new Error(errorMsg)));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::updateJobDefinitionInNamespace`,
    };

    const jobDefinitionName = jobDefinition.metadata.name;

    logger.debug(ctx, `${fn}- update payload: '${JSON.stringify(jobDefinition)}'`);

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            data: jobDefinition,
            headers: getCommonHeaders(ctx, accessDetails.accessToken, 'application/merge-patch+json'),
            json: true,
            method: 'PATCH',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobdefinitions/${jobDefinitionName}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const updatedJobDef: IJobDefinition = httpUtils.safeJSONParse(ctx, body);
                logger.trace(`${fn}- update jobdef: ${JSON.stringify(updatedJobDef)}`);

                // verify that the deletions was successful, based on the values in the returned status object
                if (!updatedJobDef || updatedJobDef.kind !== 'JobDefinition') {
                    logger.debug(ctx, `${fn}< Update failed! response: '${JSON.stringify(updatedJobDef)}'`);
                    return reject(new commonErrors.FailedToUpdateJobDefError(jobDefinitionName));
                } else {
                    logger.debug(ctx, `${fn}<`);
                    return resolve(updatedJobDef);
                }
            } else {
                // set the HTTP status currentValues into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error updating job definition of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToUpdateJobDefError(jobDefinitionName, new Error(errMessage)));
            }
        });
    });
}

/* **** -------- **** */
/* **** JOBDEF RUNS **** */
/* **** ======== **** */

export function createJobRunInNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobRun: IJobRun) {
    const fn = 'createJobRunInNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobRun: '${jobRun}'`);

    // input check
    if (!jobRun) {
        const errorMsg = 'jobRun must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToCreateJobRunError(new Error(errorMsg)));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::createJobRunInNamespace`,
    };

    // make sure that apiVersion / kind are properly set
    if (jobRun) {
        jobRun.apiVersion = `${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}`;
        jobRun.kind = 'JobRun';
    }

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            data: jobRun,
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'POST',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobruns`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const resultJobRun: IJobRun = httpUtils.safeJSONParse(ctx, body);
                logger.trace(ctx, `${fn}- created jobRun: ${JSON.stringify(resultJobRun)}`);

                logger.debug(ctx, `${fn}<`);
                return resolve(resultJobRun);
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error creating JobRun in  namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToCreateJobRunError(new Error(errMessage)));
            }
        });
    });
}

export function getJobRunOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobRunName: string): Promise<IJobRun> {
    const fn = 'getJobRunOfNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobRunName: '${jobRunName}'`);

    // input check
    if (!jobRunName) {
        const errorMsg = 'jobRunName must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToGetJobRunError(undefined));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::getJobRunOfNamespace`,
    };

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'GET',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobruns/${jobRunName}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const jobRun: IJobRun = httpUtils.safeJSONParse(ctx, body);
                logger.trace(`${fn}- jobRun: ${JSON.stringify(jobRun)}`);

                logger.debug(ctx, `${fn}<`);
                return resolve(jobRun);
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error getting job instances of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToGetJobRunError(new Error(errMessage)));
            }
        });
    });
}

export function getNumberOfJobRuns(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<IResourceStats> {
    const fn = 'getNumberOfJobRuns ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);
    return getJobRunsOfNamespace(ctx, accessDetails)
        .then((resources) => {
            const numberOfItems = resources && resources.length || 0;
            logger.debug(ctx, `${fn}< ${numberOfItems} job runs`);
            return { id: commonModel.UIEntityKinds.JOBRUN, count: numberOfItems };
        })
        .catch((err) => {
            logger.debug(ctx, `${fn}< 0 - due to an ERR`);
            return { id: commonModel.UIEntityKinds.JOBRUN, count: 0 };
        });
}

export function getJobRunsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobDefinitionName?: string): Promise<IJobRun[]> {
    const fn = 'getJobRunsOfNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobDefinitionName: '${jobDefinitionName}'`);

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::getJobRunsOfNamespace`,
    };

    let queryParams = '?limit=500';

    if (jobDefinitionName) {
        queryParams = `${queryParams}&labelSelector=${encodeURIComponent('codeengine.cloud.ibm.com/job-definition=' + jobDefinitionName)}`;
    }

    // we use urlParams as a variable here to be extensible in the future, when more query params might be added

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'GET',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobruns${queryParams}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                try {
                    const jobRuns: IJobRuns = httpUtils.safeJSONParse(ctx, body);

                    logger.trace(ctx, `${fn}- jobRunsList: ${JSON.stringify(jobRuns)}`);

                    // check whether resources list is of kind 'ServiceList' or 'RevisionList'
                    // TODO paging -> https://kubernetes.io/docs/reference/using-api/api-concepts/#retrieving-large-results-sets-in-chunks

                    if (jobRuns && jobRuns.items && jobRuns.items.length > 0) {

                        const result: IJobRun[] = jobRuns.items;

                        // sort the resource by creation date
                        result.sort(compareJobs);

                        logger.debug(ctx, `${fn}< ${result.length} jobruns`);
                        return resolve(result);
                    } else {
                        logger.debug(ctx, `${fn}< EMPTY list`);
                        return resolve([] as IJobRun[]);
                    }
                } catch (err) {
                    const errMessage = `Failed to convert response.body to JSON - URL: ${options.urls}${options.path} - Status: ${response && response.statusCode} - error: ${err.message}`;
                    logger.warn(ctx, `${fn}- ${errMessage}`);
                    logger.debug(ctx, `${fn}< ERROR`);
                    return reject(new commonErrors.FailedToGetJobRunsError(new Error(errMessage)));
                }
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error getting job instances of namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToGetJobRunsError(new Error(errMessage)));
            }
        });
    });
}

export function deleteJobRunInNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobRunName: string): Promise<any> {
    const fn = 'deleteJobRunInNamespace ';
    logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}', jobRunName: '${jobRunName}'`);

    // input check
    if (!jobRunName) {
        const errorMsg = 'jobRunName must be set properly';
        logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
        return Promise.reject(new commonErrors.FailedToDeleteJobRunError(undefined));
    }

    // prepare performance monitoring
    const startTime = Date.now();
    const monitor: monitoringModel.IPerformanceMonitor = {
        kind: 'backend',
        name: `${COMP_NAME}::deleteJobRunInNamespace`,
    };

    return new Promise((resolve, reject) => {
        const options = {
            cachePolicy: 'NO_CACHE',
            headers: getCommonHeaders(ctx, accessDetails.accessToken),
            json: true,
            method: 'DELETE',
            path: `/apis/${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}/namespaces/${accessDetails.name}/jobruns/${jobRunName}`,
            strictSSL: true,
            urls: accessDetails.serviceEndpointBaseUrl,
        };

        resiliency.request(options, (error, response, body) => {
            const duration = Date.now() - startTime;

            // check whether the request was successful
            const isSuccessful: boolean = httpUtils.isHttpResponseOk(error, response);

            // log the backend call
            monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

            // create a performance monitoring entry
            monitorUtils.storePerfMonitorEntry(monitor, duration);

            if (isSuccessful) {

                const opStatus: IKubernetesStatus = httpUtils.safeJSONParse(ctx, body);
                logger.trace(ctx, `${fn}- delete operation status: ${JSON.stringify(opStatus)}`);

                // verify that the deletions was successful, based on the values in the returned status object
                if ((opStatus.kind !== 'Status') ||
                    (opStatus.status !== 'Success')) {
                    return reject(new commonErrors.FailedToDeleteJobRunError(jobRunName));
                } else {
                    logger.debug(ctx, `${fn}<`);
                    return resolve(opStatus);
                }
            } else {
                // set the HTTP status code into the error
                error = httpUtils.getK8EnhancedErrorObj(ctx, error, response, body);

                const errMessage = `Error deleting JobRun in namespace '${accessDetails.name}' - URL: ${accessDetails.serviceEndpointBaseUrl}${options.path} - error: ${JSON.stringify(error)}`;
                logger.warn(ctx, `${fn}- ${errMessage}`);
                logger.debug(ctx, `${fn}< ERROR`);
                return reject(new commonErrors.FailedToDeleteJobRunError(jobRunName, new Error(errMessage)));
            }
        });
    });
}
