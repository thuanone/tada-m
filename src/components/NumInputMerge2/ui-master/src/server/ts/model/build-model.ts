
export const COLIGO_BUILD_API_GROUP = 'build.dev';
export const COLIGO_BUILD_API_VERSION = 'v1alpha1';

export interface IBuildStatus {
    reason?: string;
    registered?: string;
}

export interface IBuildSpec {
    builder?: any;
    dockerfile?: string;
    output: IBuildOutput;
    source: {
        contextDir?: string;
        credentials?: {
            name: string;
        },
        flavor?: string;
        httpProxy?: string;
        httpsProxy?: string;
        noProxy?: string;
        revision?: string;
        url: string;
    };
    strategy: {
        apiVersion?: string;
        kind?: string;
        name: string;
    };
    timeout?: string;
}

export interface IBuildOutput {
    credentials: {
        name: string;
    };
    image: string;
}

// https://github.com/redhat-developer/build/blob/master/deploy/crds/build.dev_builds_crd.yaml
export interface IBuild {
    apiVersion: string; // "builds.build.dev/v1alpha1",
    kind: string; // "Build"
    metadata: {
        annotations?: {
            [key: string]: string;
        },
        creationTimestamp?: string;
        generateName?: string;
        generation?: number;
        labels?: {
            [key: string]: string;
        },
        name?: string;
        namespace?: string;
        resourceVersion?: string;
        selfLink?: string;
    };

    spec: IBuildSpec;
    status?: IBuildStatus;
}

export interface IBuilds {
    apiVersion: string;
    items: IBuild[];
    kind: string; // "List",
    metadata: {
        resourceVersion: string;
        selfLink: string;
    };
}

export interface IBuildRunStatus {
    buildSpec: IBuildSpec;
    completionTime?: string;
    latestTaskRunRef?: string;
    reason?: string;
    startTime?: string;
    succeeded?: string;
}

export interface IBuildRun {
    apiVersion: string; // "builds.build.dev/v1alpha1",
    kind: string; // "BuildRun"
    metadata: {
        creationTimestamp?: string;
        generateName?: string;
        generation?: number;
        labels?: {
            [key: string]: string;
        },
        name: string;
        namespace?: string;
        resourceVersion?: string;
        selfLink?: string;
    };
    spec: {
        buildRef: {
            name: string;
        },
        output?: IBuildOutput,
        serviceAccount?: {
            generate?: boolean;
            name?: string;
        }
        timeout?: string;
    };
    status?: IBuildRunStatus;
}

export interface IBuildRuns {
    apiVersion: string;
    items: IBuildRun[];
    kind: string; // "List",
    metadata: {
        resourceVersion: string;
        selfLink: string;
    };
}
