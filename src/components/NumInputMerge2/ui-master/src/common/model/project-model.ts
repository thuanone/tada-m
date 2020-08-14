/**
 * Defines interfaces for Project specific UI pages and their respective REST endpoints in the Express.js app
 */

import { UIEntityKinds, IUIInstance } from './common-model';

export enum UIResourceInstanceStatus {
    ACTIVE = 'ACTIVE',
    DELETING = 'DELETING',
    PROVISIONING = 'PROVISIONING',
    REMOVED = 'REMOVED',
}

export function stringify(entity: any): string {
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

export function stringifyConsumption(info: IUIProjectConsumptionInfo): string {
    if (!info) { return 'NULL'; }
    return `ProjectConsumption[${info.totalNumberOfInstances} instances, ${info.totalMemory} bytes memory, ${info.totalCpus} cpus]`;
}

export interface IUIProject {
    id: string;
    kind: string;
    name: string;
    region: string;
    crn: string;

    created?: number | undefined;
    lastModified?: number | undefined;
    state?: UIResourceInstanceStatus;

    projectStatus?: IUIProjectStatus;

    resourceGroupId?: string;

    resourcePlanId?: string;

    tags?: string[];

    isDeleting?: boolean;
    isDisabled?: boolean;

}

export type IUIProjects = IUIProject[];
export interface IUIResourceGroup {
    crn: string;
    default: boolean;
    name: string;
    id: string;
    state: string;
}

export type IUIResourceGroups = IUIResourceGroup[];

export interface IUIRegion {
    id: string;
}

export type IUIRegions = IUIRegion[];

export interface IUIProjectStatus {
    // is used for project expiry, this field is not set via RC
    expireTimestamp?: number | undefined;
    domain: boolean;
    tenant: boolean;
}

export interface IUIProjectConsumptionInfo {
    totalNumberOfInstances: number;
    totalMemory: number;
    totalCpus: number;
    numberOfAppInstances: number;
    numberOfJobInstances: number;
    numberOfBuildInstances: number;

    memoryOfAppInstances: number;
    memoryOfJobInstances: number;
    memoryOfBuildInstances: number;

    cpusOfAppInstances: number;
    cpusOfJobInstances: number;
    cpusOfBuildInstances: number;

    instances: IUIInstance[];
    timestamp: number;

    entityStats: { [key: string]: number };
}
export function getNewProjectConsumptionInfo(): IUIProjectConsumptionInfo {
    return {
        totalNumberOfInstances: 0,
        totalMemory: 0,
        totalCpus: 0,
        numberOfAppInstances: 0,
        numberOfJobInstances: 0,
        numberOfBuildInstances: 0,

        memoryOfAppInstances: 0,
        memoryOfJobInstances: 0,
        memoryOfBuildInstances: 0,

        cpusOfAppInstances: 0,
        cpusOfJobInstances: 0,
        cpusOfBuildInstances: 0,

        instances: [],
        timestamp: Date.now(),

        entityStats: {},
    };
}
