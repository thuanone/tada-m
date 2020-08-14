import * as commonErrors from './../Errors';

/**
 * Defines common interfaces for all UI pages and their respective REST endpoints in the Express.js app
 */
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

export function stringifyUIRequestError(err: UIRequestError) {
    return `UIRequestError[clgId: ${err.clgId}, statusCode: ${err.statusCode}, duration: ${err.duration}, error: '${commonErrors.stringify(err.error)}']`;
}

export function stringifyUIRequestResult(result: IUIRequestResult) {
    if (!result) {
        return undefined;
    }
    return `IUIRequestResult[clgId: ${result.clgId}, status: ${result.status}, duration: ${result.duration}, payload: '${JSON.stringify(result.payload)}']`;
}

export enum UIEntityKinds {
    APPLICATION = 'Application',
    APPLICATIONREVISION = 'AppRevision',
    BUILD = 'Build',
    BUILDRUN = 'BuildRun',
    CONFMAP = 'ConfigMap',
    CONTAINERREGISTRY = 'ContainerRegistry',
    CONTAINERREGISTRYIMAGE = 'ContainerRegistryImage',
    CONTAINERREGISTRYNAMESPACE = 'ContainerRegistryNamespace',
    CONTAINERREGISTRYREPOSITORY = 'ContainerRegistryRepository',
    JOBRUN = 'JobRun',
    JOBRUNINSTANCE = 'JobRunInstance',
    JOBDEFINITION = 'JobDefinition',
    PROJECT = 'Project',
    SECRET = 'Secret',
}

export enum UIEntityStatus {
    DEPLOYING = 'DEPLOYING',
    FAILED = 'FAILED',
    READY = 'READY',
    UNKNOWN = 'UNKNOWN',
    WAITING = 'WAITING',
}

export enum UIOperationStatus {
    OK = 'OK',
    FAILED = 'FAILED',
}

export interface IUIOperationResult {
    status: UIOperationStatus;
    error?: commonErrors.GenericUIError;
}

export enum UIRequestStatus {
    OK = 'OK',
    REJECTED = 'REJECTED',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export enum SegmentEventTypes {
    CREATED = 'Created Object', // https://segment-standards.w3bmix.ibm.com/events/created-object
    DELETED = 'Deleted Object', // https://segment-standards.w3bmix.ibm.com/events/deleted-object
    UPDATED = 'Updated Object', // https://segment-standards.w3bmix.ibm.com/events/updated-object
    CUSTOM = 'Custom Event',
}

export enum SegmentCustomEventActions {
    APPLICATION_INVOKE = 'application-invoke',
    UNKNOWN = 'unknown',
}

export enum SegmentCodeEngineObjectTypes {
    APPLICATION = 'application',
    APPLICATION_REVISION = 'applicationrevision',
    BUILD = 'build',
    BUILDRUN = 'buildrun',
    CONFMAP = 'configmap',
    JOBDEFINITION = 'jobdefinition',
    JOBRUN = 'jobrun',
    PROJECT = 'project',
    SECRET = 'secret',
}

export interface IUIRequestResult {
    clgId: string;
    status: UIRequestStatus;
    duration: number;
    payload?: any;
}

export interface IUIRequestError {
    clgId: string;
    statusCode: number;
    duration: number;
    error: commonErrors.GenericUIError;
}

export class UIRequestError extends Error implements IUIRequestError {
    public clgId: string;
    public statusCode: number;
    public nlsKey: string;
    public nlsProps: { [key: string]: any; };
    public error: commonErrors.GenericUIError;
    public duration: number;

    constructor(clgId, statusCode: number, startTime: number, error: commonErrors.GenericUIError, nlsKey?: string, nlsProps?: { [key: string]: any; }) {
        super();
        this.clgId = clgId,
            this.statusCode = statusCode;
        this.duration = Date.now() - startTime;
        this.error = error;
    }

    public toString(): string {
        return `UIRequestError[clgId: ${this.clgId}, statusCode: ${this.statusCode}, duration: ${this.duration}, error: '${commonErrors.stringify(this.error)}']`;
    }
}

export interface IUIRequestContext {
    user?: any;   // req.user
    session?: { [key: string]: any; };
    startTime: number;
    tid: string;  // either generate a unique tid or re-use what ACE gives us
}

export interface IUIServiceStatus {
    id: string;
    status: 'OK' | 'FAILED' | 'ERROR';
    details?: string;
}

/**
 * Environment variable interfaces for kube containers (used by Applications and JobDefs)
 */
export enum IUIEnvItemKind {
    PREDEFINED = 'PREDEFINED',  // defined during build-time inside the container image
    LITERAL = 'LITERAL',
    MAPREF = 'MAPREF',
    KEYREF = 'KEYREF',
    UNSUPPORTED = 'UNSUPPORTED',  // for all environment types that we do not (yet) support [env type]
    UNSUPPORTED_FROM = 'UNSUPPORTED_FROM',  // for all environment types that we do not (yet) support [envFrom type]
}

export enum IUIEnvRefKind {
    CONFIGMAP = 'CONFIGMAP',
    SECRET = 'SECRET',
    UNSUPPORTED = 'UNSUPPORTED', // in case neither configMap or secret references are there (could be an unsupported type of reference)
}

export interface IUIEnvItem {
    kind: IUIEnvItemKind;
}

/**
 * EnvItem literally providing a name and value (as string values)
 */
export interface IUIEnvItemLiteral extends IUIEnvItem {
    name: string;
    value: string;
}

export interface IUIEnvItemUnsupported extends IUIEnvItem {
    name: string;
    originalValue: any; // a deep copy of the original property from the backend (so we can put it back as-is on save)
}

/**
 * EnvItem referencing a single key inside a configMap or secret
 */
export interface IUIEnvItemKeyRef extends IUIEnvItem {
    keyRefKind: IUIEnvRefKind;
    name: string;
    valueFrom: {  // refers to either a configMap or secret by name
        name: string;
        key: string;
        optional?: boolean;
    };
}

/**
 * EnvItem referencing a whole configMap or secret (which is a special configMap as well)
 */
export interface IUIEnvItemMapRef extends IUIEnvItem {
    mapRefKind: IUIEnvRefKind;
    prefix?: string;
    valuesFrom: {  // refers to either a configMap or secret by name
        name: string;
        optional?: boolean;
    };
}

/**
 * EnvItem defined by a container image
 *
 * The override field is for UI purposes only and carries the reference to another IUIEnvItem, in case there is an override for
 * the predefined item (which will be saved separately as a fully-featured item itself)
 */
export interface IUIEnvItemPredefined extends IUIEnvItemLiteral {
    override?: IUIEnvItemLiteral | IUIEnvItemKeyRef;
}

export type IUIEnvItems = IUIEnvItem[];

export interface IUIInstance {
    id: string;
    componentKind: string;
    componentId: string;
    statusPhase: string;
    created: number;
    memory: number;  // in bytes
    cpus: number;
}
