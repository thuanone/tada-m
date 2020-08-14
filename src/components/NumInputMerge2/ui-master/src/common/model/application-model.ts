/**
 * Defines interfaces for Application specific UI pages and their respective REST endpoints in the Express.js app
 */

import { IUIEnvItems, UIEntityStatus } from './common-model';

export function stringifyList(entities: IUIApplicationRevision[]): string {
    if (entities && Array.isArray(entities)) {
        return `${entities.length} items`;
    }
    return 'EMPTY LIST';
}

export function stringify(entity: IUIApplication | IUIApplicationRevision): string {
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

export interface IUIApplication {
    id: string;
    kind: string;
    name?: string;
    created?: number | undefined;
    lastModified?: number | undefined;

    regionId: string;
    namespace?: string;
    projectId?: string;

    revision?: IUIApplicationRevision;
    template?: IUIApplicationTemplate;

    generation?: number;
    latestCreatedRevisionName?: string;
    latestReadyRevisionName?: string;
    publicServiceUrl?: string;
    status?: UIEntityStatus;
    statusConditions?: IUIApplicationStatusCondition[];
    isDeleting?: boolean;
}

export type IUIApplications = IUIApplication[];

export interface IUIApplicationTemplate {
    memory?: number | undefined;  // in bytes
    cpus?: number | undefined;  // only whole numbers, no fractions supported
    minScale?: number;
    maxScale?: number;
    timeoutSeconds?: number; // in seconds
    containerConcurrency?: number; // in seconds

    parameters?: IUIEnvItems;
    image?: string;
    imagePullSecret?: string;
}

export interface IUIApplicationRevision extends IUIApplicationTemplate {
    id: string | undefined;
    kind: string;
    name?: string;
    created?: number | undefined;
    lastModified?: number | undefined;

    regionId?: string;
    namespace?: string;

    generation?: number;
    status?: UIEntityStatus;
    statusConditions?: IUIApplicationStatusCondition[];
}

export interface IUIApplicationConfiguration {
    statusConditions?: IUIApplicationStatusCondition[];
}

export type IUIApplicationRevisions = IUIApplicationRevision[];

export interface IUIApplicationTrafficTargets {
    [key: string]: number;
}

export interface IUIApplicationRoutingTags {
    [key: string]: string[];
}

export interface IUIApplicationRoute {
    trafficTargets: IUIApplicationTrafficTargets;
    routingTags: IUIApplicationRoutingTags;
}

export interface IUIApplicationInvocationResult {
    durationInMillis: number;
    endTime: number;
    responseBody: any;
}

export interface IUIApplicationStatusCondition {
    type: string;
    status: string;
    lastTransitionTime: number;
    message?: string;
    reason?: string;
    severity: string;
}

export interface IUIApplicationInstance {
    id: string;
    name: string;
    application: string;
    revision: string;
    statusPhase: string;
    created: number | undefined;
}

export interface IUIApplicationInvocation {
    url: string;
    verb?: string;
    headers?: { [key: string]: string };
    data?: { [key: string]: string };
}
