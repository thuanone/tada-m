import { IKubernetesSecretRef } from './../model/k8s-model';
// 3rd-party
import { clone } from 'lodash';

// coligo
import { UIEntityKinds } from '../../../common/model/common-model';
import {
    IUIJobDefinition,
    IUIJobDefinitionSpec,
    IUIJobRun,
    IUIJobRunInstancesStatus,
    UIJobRestartPolicy,
    UIJobStatus
} from '../../../common/model/job-model';
import * as memUtils from '../../../common/utils/memory-utils';
import { convertBytesToDisplayValue } from '../../../common/utils/memory-utils';
import {
    COLIGO_JOBS_API_GROUP,
    COLIGO_JOBS_API_VERSION,
    IContainer,
    IJobDefinition,
    IJobDefinitionSpec,
    IJobRun
} from '../model/job-model';
import { mapEnvItemsToEnvVarResult, mapEnvVarsToEnvItems } from './common-mapper';

interface IJobRunTimingStatus {
    completedTime: number;
    failedTime: number;
    startedTime: number;
}

function parseStringDate(dateStr: string): number | undefined {
    let result;

    if (dateStr) {
        const epoch = Date.parse(dateStr);
        if (!isNaN(epoch)) {
            result = epoch;
        }
    }
    return result;
}

function toStringDate(timestamp: number): string {
    return new Date(timestamp).toUTCString();
}

function computeJobRunTimingStatus(jobRun: IJobRun): IJobRunTimingStatus {
    const result: IJobRunTimingStatus = {
        completedTime: undefined,
        failedTime: undefined,
        startedTime: undefined,
    };

    let previousType = '';

    if (jobRun && jobRun.status) {
        if (jobRun.status.conditions) {
            for (const condition of jobRun.status.conditions) {
                if (condition.type === 'Running' &&
                    previousType === 'Pending' &&
                    !result.startedTime) {
                    result.startedTime = parseStringDate(condition.lastTransitionTime);
                } else if (condition.type === 'Failed') {
                    result.failedTime = parseStringDate(condition.lastTransitionTime);
                } else if (condition.type === 'Complete') {
                    result.completedTime = parseStringDate(condition.lastTransitionTime);
                }

                previousType = condition.type;
            }

            // TODO use proper logging
            // console.log('computeJobRunTimingStatus :');
            // console.dir(result);

            // in case we have both failed AND completedTime here, we choose the older one as the actual
            // result
            if (result.failedTime && result.completedTime) {
                if (result.failedTime > result.completedTime) {
                    result.completedTime = undefined;
                } else {
                    result.failedTime = undefined;
                }
            }
        } else if (jobRun.status.completionTime) {
            result.completedTime = parseStringDate(jobRun.status.completionTime);
        }
    }

    return result;
}

export function countInstances(arraySpec: string): number {
    if (arraySpec === undefined) {
        return undefined;
    }
    const arraySpecIndices = arraySpec.split(',');
    let  numInstances = 0;
    arraySpecIndices.forEach((index) => {
        if (index.includes('-')) {
            const rangeArray = index.split('-');
            const range = parseInt(rangeArray[1], 10) - parseInt(rangeArray[0], 10) + 1;
            numInstances += range;
        } else {
            numInstances++;
        }
    });
    return numInstances;
}

/**
 * Scans a given IJobRun status and converts it to a status value used in an IUIJobRun
 */
function mapJobStatusCode(jobRun: IJobRun): UIJobStatus {
    let result;
    if (jobRun.status) {
        const numInstances = jobRun.spec.arraySize || countInstances(jobRun.spec.arraySpec);
        const numCompleted = jobRun.status.failed + jobRun.status.succeeded;
        const numStarted = jobRun.status.active + jobRun.status.succeeded + jobRun.status.failed;
        if (parseStringDate(jobRun.status.completionTime) || (numCompleted >= numInstances)) {
            result = (jobRun.status.succeeded === numInstances) ? UIJobStatus.SUCCEEDED : UIJobStatus.FAILED;
        } else {
            if (jobRun.status.failed >= numInstances) {
                result = UIJobStatus.FAILED;
            } else {
                result = (numStarted > 0) ? UIJobStatus.RUNNING : UIJobStatus.WAITING;
            }
        }
    } else {
        result = UIJobStatus.WAITING;
    }

    return result;
}

/**
 * Scans a given IJobRun status and converts the information about failed/successful/running instances
 */
function mapJobRunInstancesStatusCode(jobRun: IJobRun): IUIJobRunInstancesStatus {
    const numInstances = jobRun.spec.arraySize || countInstances(jobRun.spec.arraySpec);

    if (jobRun.status) {
        const numUnknown = jobRun.status.unknown || 0;
        const numPending = jobRun.status.pending || 0;
        const numRunning = jobRun.status.active || 0;
        const numSucceeded = jobRun.status.succeeded || 0;
        const numFailed = jobRun.status.failed || 0;
        const numWaiting = Math.max(numUnknown + numPending, (numInstances - numRunning - numSucceeded - numFailed)) || 0;

        return {
            numFailed,
            numPending,
            numRunning,
            numSucceeded,
            numUnknown,
            numWaiting
        };
    } else {
        return {
            numFailed: 0,
            numPending: 0,
            numRunning: 0,
            numSucceeded: 0,
            numUnknown: numInstances,
            numWaiting: 0,
        };
    }
}

function mapJobRestartPolicy(restartPolicy: string): UIJobRestartPolicy {
    if (restartPolicy === 'Never') {
        return UIJobRestartPolicy.NEVER;
    } else {
        return UIJobRestartPolicy.ON_FAILURE;
    }
}

function reverseMapRestartPolicy(restartPolicy: UIJobRestartPolicy): string {
    if (restartPolicy === UIJobRestartPolicy.NEVER) {
        return 'Never';
    } else {
        return 'OnFailure';
    }
}

function mapColigoJobDefinitionSpecToJobDefinitionSpec(jobSpec: IJobDefinitionSpec): IUIJobDefinitionSpec {
    if (jobSpec.containers && jobSpec.containers[0]) {
        const container = jobSpec.containers[0];
        const result: IUIJobDefinitionSpec = {
            containerName: container.name,
            cpus: parseInt(container.resources.requests.cpu, 10),
            image: container.image,
            imagePullSecret: convertKubeSecretRefsToImagePullSecret(jobSpec),
            memory: memUtils.convertValueToBytes(container.resources.requests.memory),
            restartPolicy: mapJobRestartPolicy(jobSpec.restartPolicy),
        };

        if (container.args) {
            result.args = [...container.args];
        } else {
            result.args = [];
        }

        if (container.command) {
            result.command = [...container.command];
        } else {
            result.command = [];
        }

        if (container.env || container.envFrom) {
            result.env = mapEnvVarsToEnvItems(container.env || [], container.envFrom || []);
        } else {
            result.env = [];
        }

        return result;
    }
}

function mapUIJobDefinitionSpecToColigoJobDefinitionSpec(jobSpec: IUIJobDefinitionSpec): IJobDefinitionSpec {
    const result: IJobDefinitionSpec = {
        containers: [],
        imagePullSecrets: convertImagePullSecretToKubeSecrets(jobSpec),
        restartPolicy: reverseMapRestartPolicy(jobSpec.restartPolicy),
    };

    const container: IContainer = {
        image: jobSpec.image,
        name: jobSpec.containerName,
        resources: {
            requests: {
                cpu: `${jobSpec.cpus}`,
                memory: `${convertBytesToDisplayValue(jobSpec.memory, 'mib')}Mi`,
            }
        }
    };

    if (jobSpec.args && jobSpec.args.length > 0) {
        container.args = [...jobSpec.args];
    }

    if (jobSpec.command && jobSpec.command.length > 0) {
        container.command = [...jobSpec.command];
    }

    if (jobSpec.env && jobSpec.env.length > 0) {
        const envVarResult = mapEnvItemsToEnvVarResult(jobSpec.env);
        container.env = envVarResult.env || [];
        container.envFrom = envVarResult.envFrom || [];
    }

    result.containers.push(container);

    return result;
}

export function mapColigoJobDefinitionToUIJobDefinition(jobDef: IJobDefinition, regionId: string, projectId: string): IUIJobDefinition {
    let result: IUIJobDefinition;

    if (jobDef.metadata && jobDef.spec) {
        result = {
            created: parseStringDate(jobDef.metadata.creationTimestamp),
            id: jobDef.metadata.name,
            kind: UIEntityKinds.JOBDEFINITION,
            labels: jobDef.metadata.labels ? clone(jobDef.metadata.labels) : {},
            name: jobDef.metadata.name,
            spec: mapColigoJobDefinitionSpecToJobDefinitionSpec(jobDef.spec),

            projectId,
            regionId,
        };
    }

    return result;
}

export function mapUIJobDefinitionToColigoJobDefinition(jobDef: IUIJobDefinition): IJobDefinition {
    let result: IJobDefinition;

    if (jobDef.kind === UIEntityKinds.JOBDEFINITION) {
        result = {
            apiVersion: `${COLIGO_JOBS_API_GROUP}/${COLIGO_JOBS_API_VERSION}`,
            kind: 'JobDefinition',
            metadata: {
                labels: jobDef.labels ? clone(jobDef.labels) : {},
                name: jobDef.name,
            },
            spec: mapUIJobDefinitionSpecToColigoJobDefinitionSpec(jobDef.spec),
        };
    }

    return result;
}

export function mapUIJobRunToColigoJobRun(jobRun: IUIJobRun): IJobRun {
    let result: IJobRun;

    if (!jobRun) {
        return result;
    }

    if (jobRun.kind === UIEntityKinds.JOBRUN) {
        result = {
            apiVersion: COLIGO_JOBS_API_VERSION,
            kind: 'JobRun',
            metadata: {
                generateName: (!jobRun.name && jobRun.generateName) ? jobRun.generateName : undefined,  // .name takes precedence over 'generateName'
                labels: jobRun.labels ? clone(jobRun.labels) : {},
                name: jobRun.name ? jobRun.name : undefined,
            },
            spec: {
                arraySpec: jobRun.arraySpec,
                //                jobDefinitionSpec: mapUIJobDefinitionSpecToColigoJobDefinitionSpec(jobRun.spec),
                maxExecutionTime: jobRun.maxExecutionTime,
                retryLimit: (jobRun.retryLimit < 0 || jobRun.retryLimit === undefined) ? 2 : jobRun.retryLimit,
            },
        };

        if (jobRun.definitionName) {
            result.spec.jobDefinitionRef = jobRun.definitionName;
            result.spec.jobDefinitionSpec = {
                containers: [
                    {
                        image: jobRun.spec.image,
                        name: jobRun.spec.containerName,
                        resources: {
                            requests: {
                                cpu: `${jobRun.spec.cpus}`,
                                memory: `${convertBytesToDisplayValue(jobRun.spec.memory, 'mib')}Mi`,
                            },
                        },
                    },
                ],
            };
        } else {
            result.spec.jobDefinitionSpec = mapUIJobDefinitionSpecToColigoJobDefinitionSpec(jobRun.spec);
        }
    }

    return result;
}

export function mapColigoJobRunToUIJobRun(jobRun: IJobRun, regionId: string, projectId: string): IUIJobRun {
    if (!jobRun || jobRun.kind !== UIEntityKinds.JOBRUN) {
        return undefined;
    }

    const completionInfo = computeJobRunTimingStatus(jobRun);

    const result: IUIJobRun = {
        id: jobRun.metadata && jobRun.metadata.name,
        kind: UIEntityKinds.JOBRUN,
        labels: jobRun.metadata && jobRun.metadata.labels ? clone(jobRun.metadata.labels) : {},
        name: jobRun.metadata && jobRun.metadata.name,

        arraySpec: jobRun.spec.arraySpec,
        completed: completionInfo.completedTime || completionInfo.failedTime,
        created: jobRun.status ? parseStringDate(jobRun.status.startTime) : undefined,
        definitionName: jobRun.spec.jobDefinitionRef,
        effectiveSpec: jobRun.status && jobRun.status.effectiveJobDefinitionSpec ? mapColigoJobDefinitionSpecToJobDefinitionSpec(jobRun.status.effectiveJobDefinitionSpec) : undefined,
        instanceStatus: mapJobRunInstancesStatusCode(jobRun),
        logsUrl: '',
        maxExecutionTime: jobRun.spec.maxExecutionTime,
        retryLimit: jobRun.spec.retryLimit,
        spec: jobRun.spec.jobDefinitionSpec ? mapColigoJobDefinitionSpecToJobDefinitionSpec(jobRun.spec.jobDefinitionSpec) : undefined,
        started: completionInfo.startedTime,
        status: mapJobStatusCode(jobRun),
        failedIndices: jobRun.status && jobRun.status.failedIndices,

        projectId,
        regionId,
    };

    return result;
}

export function convertImagePullSecretToKubeSecrets(jobSpec: IUIJobDefinitionSpec): IKubernetesSecretRef[] {
    if (!jobSpec || !jobSpec.imagePullSecret) {
        return [];
    }

    return [ { name: jobSpec.imagePullSecret} ];
}

export function convertKubeSecretRefsToImagePullSecret(jobSpec: IJobDefinitionSpec): string {
    if (!jobSpec || !jobSpec.imagePullSecrets || jobSpec.imagePullSecrets.length === 0) {
        return undefined;
    }

    return jobSpec.imagePullSecrets[0].name;
}
