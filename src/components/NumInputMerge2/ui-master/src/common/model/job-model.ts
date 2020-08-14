/**
 * Defines interfaces for JobRun and JobDefinition specific UI pages and their respective REST endpoints in the Express.js app
 */

import { IUIEnvItems } from './common-model';

export function stringify(entity: IUIJobRunInstance | IUIJobDefinition | IUIJobRun): string {
    if (!entity) { return 'NULL'; }

    let str = `${entity.kind || '???'}[`;
    if (entity.name) {
        str += `name: ${entity.name}`;
    } else if (entity.id) {
        str += `id: ${entity.id}`;
    }
    str += ']';
    return str;
}

export enum UIJobRestartPolicy {
    NEVER= 'NEVER',
    ON_FAILURE = 'ON_FAILURE',
}

export enum UIJobStatus {
    WAITING = 'WAITING',
    RUNNING = 'RUNNING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export interface IUIJobRunInstancesStatus {
    numWaiting: number;  // combination of numPending & numUnknown
    numRunning: number;
    numFailed: number;
    numSucceeded: number;
    numPending: number;
    numUnknown: number;
}

export interface IUIJobRunInstance {
    id: string;
    isDeleting?: boolean;
    kind: string;
    name: string;
    created?: number | undefined;
    lastModified?: number | undefined;
    completed: number | undefined;
    status?: UIJobStatus | undefined;
}

export type IUIJobRunInstances = IUIJobRunInstance[];

export interface IUIJobDefinitionSpec {
    containerName?: string;
    args?: string[];
    command?: string[];
    env?: IUIEnvItems;
    image: string;
    imagePullSecret?: string;
    memory?: number | undefined; // in bytes - UI converts to desired display value and unit
    cpus?: number | undefined;  // only whole numbers, no fractions supported
    restartPolicy?: UIJobRestartPolicy;
}

export interface IUIJobDefinition {
    id: string;
    kind: string;
    name?: string;
    created?: number;  // creation timestamp
    isDeleting?: boolean;
    labels?: {
        [key: string]: string;
    };

    spec: IUIJobDefinitionSpec;

    regionId?: string; // necessary for creating links to other components in the same project
    projectId?: string; // necessary for creating links to other components in the same project
}

export type IUIJobDefinitions = IUIJobDefinition[];

export interface IUIJobRun {
    id?: string;
    isDeleting?: boolean;
    key?: string;  // for use in a REACT table only
    kind: string;
    name?: string;
    generateName?: string;
    created?: number;  // creation time
    completed?: number;  // end time (regardless of outcome : succeeded/failed)
    started?: number; // start time (when the job went from PENDING to RUNNING state)
    spec?: IUIJobDefinitionSpec;
    definitionName?: string; // the jobDefinitionRef, if available
    effectiveSpec?: IUIJobDefinitionSpec;
    status?: UIJobStatus | undefined;
//    duration?: number | undefined;  // this one should be always dynamically computed: if completed is set, as the difference of completed - created, otherwise now() - created
    labels?: {
        [key: string]: string;
    };
    logsUrl?: string | undefined;
    instanceStatus?: IUIJobRunInstancesStatus | undefined;
    instances?: IUIJobRunInstances | undefined;  // ?? tbd ?? - can be undefined for now
    arraySpec: string | undefined;
    maxExecutionTime: number | undefined;
    retryLimit?: number | undefined;
    failedIndices?: string | undefined;
    regionId?: string; // necessary for creating links to the jobdefinition
    projectId?: string; // necessary for creating links to the jobdefinition
}

export type IUIJobRuns = IUIJobRun[];
