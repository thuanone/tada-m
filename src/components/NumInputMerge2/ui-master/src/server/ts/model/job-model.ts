import { IEnvVarFromList, IEnvVarList, IKubernetesSecretRef } from './k8s-model';

export const COLIGO_JOBS_API_GROUP = 'codeengine.cloud.ibm.com';
export const COLIGO_JOBS_API_VERSION = 'v1alpha1';

export interface IStatusCondition {
    lastProbeTime: string;
    lastTransitionTime: string;
    status: string;
    type: string;
    message?: string;
    reason?: string;
}

export type IConditions = IStatusCondition[];

export interface IContainer {
    args?: string[];
    command?: string[];
    env?: IEnvVarList;
    envFrom?: IEnvVarFromList;
    image: string;
    name: string;
    resources: {
        requests: {
            cpu: string;
            memory: string;
        }
    };
}

export interface IJobDefinitionSpec {
    containers: IContainer[];
    imagePullSecrets?: IKubernetesSecretRef[];
    restartPolicy?: string;
}

export interface IJobDefinition {
    apiVersion: string; // "codeengine.cloud.ibm.com/v1alpha1",
    kind: string; // "JobDefinition"
    metadata: {
        creationTimestamp?: string;
        generation?: number;
        labels: {
            [key: string]: string;
        },
        name: string;
        namespace?: string;
        resourceVersion?: string;
        selfLink?: string;
    };

    spec: IJobDefinitionSpec;
}

export interface IJobDefinitions {
    apiVersion: string;
    items: IJobDefinition[];
    kind: string; // "List",
    metadata: {
        continue?: string,  // encoded token for "pagination" support
        resourceVersion: string;
        selfLink: string;
    };
}

export interface IJobRunSpec {
    arraySize?: number;
    arraySpec?: string;
    jobDefinitionSpec?: IJobDefinitionSpec;
    jobDefinitionRef?: string;
    maxExecutionTime: number;
    retryLimit: number;
}

export interface IJobRunStatus {
    completionTime?: string;
    conditions?: IConditions;
    effectiveJobDefinitionSpec: IJobDefinitionSpec;
    startTime: string;
    unknown?: number;
    pending?: number;
    succeeded?: number;
    active?: number;
    failed?: number;
    failedIndices?: string;
}

export interface IJobRun {
    apiVersion: string; // "codeengine.cloud.ibm.com/v1alpha1",
    kind: string; // "JobRun"
    metadata: {
        creationTimestamp?: string;
        generateName?: string;
        generation?: number;
        labels: {
            [key: string]: string;
        },
        name?: string;
        namespace?: string;
        resourceVersion?: string;
        selfLink?: string;
    };

    spec: IJobRunSpec;
    status?: IJobRunStatus;
}

export interface IJobRuns {
    apiVersion: string;
    items: IJobRun[];
    kind: string; // "List",
    metadata: {
        resourceVersion: string;
        selfLink: string;
    };
}
