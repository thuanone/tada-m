export interface IKubernetesQueryParameters {
    continueToken?: string;
    fieldSelector?: string;
    labelSelector?: string;
    limit?: number;
}

export interface IKubernetesStatusCondition {
    lastTransitionTime: string;
    status: string;
    type: string;
    lastProbeTime?: string;
    message?: string;
    reason?: string;
    severity?: string;
}

/**
 * Environment related interfaces for kube containers.
 */
export interface IKeyRef {
    key: string;
    name: string;  // reference to the configMap or secret (by name)
    optional?: boolean;
}

export interface IEnvVarValueFrom {
    configMapKeyRef?: IKeyRef;
    secretKeyRef?: IKeyRef;
    // fieldRef: ObjectFieldSelector           - NOT SUPPORTED
    // resourceFieldRef: ResourceFieldSelector    - NOT SUPPORTED
}

export interface IEnvVar {
    name: string;
    value?: string;
    valueFrom?: IEnvVarValueFrom;
}

export interface IMapRef {
    name: string;  // reference to the configMap or secret (by name)
    optional?: boolean;
}
export interface IEnvVarFrom {
    prefix?: string;   // prefix used to build envVar names from all the keys like "prefix+key"
    configMapRef?: IMapRef;
    secretRef?: IMapRef;
}

export type IEnvVarList = IEnvVar[];
export type IEnvVarFromList = IEnvVarFrom[];

export interface IEnvVarResult {
    env: IEnvVarList;
    envFrom: IEnvVarFromList;
}

/**
 * Interface of a kube pod, which we will see when listing jobruns via 'kubectl get pods'
 */
export interface IKubernetesPod {
    apiVersion: string;  // 'v1'
    kind: string;   // 'Pod'
    metadata: {
        annotations: {
            'kubernetes.io/psp': string; // 'ibm-privileged-psp'
        },
        creationTimestamp: string; // '2020-02-14T13:40:21Z',
        generateName: string; // 'hello-jobrun-2jbvg-0-',
        labels: {
            [key: string]: string;
        },
        name: string; // 'hello-jobrun-2jbvg-0-rtsjg',
        namespace: string; // '4695436422e0',
        ownerReferences: Array<{
                apiVersion: string; // 'codeengine.cloud.ibm.com/v1alpha1',
                blockOwnerDeletion: boolean; // true,
                controller: boolean; // true,
                kind: string; // 'JobRun',
                name: string; // 'hello-jobrun-2jbvg',
                uid: string; // 'ba0721e4-c386-4daa-bcb8-898fa4a9016f'
            }>;
        resourceVersion: number; // 27088823,
        selfLink: string; // '/api/v1/namespaces/4695436422e0/pods/hello-jobrun-2jbvg-0-rtsjg',
        uid: string; // 'c1225863-f8a3-483f-a021-1537f7c8e84d'
    };

    spec: {
        containers: Array<{
                args: string[],
                env: Array<{
                        name: string; // 'JOB_INDEX',
                        value: string; // '0'
                    }>;
                image: string; // 'busybox',
                imagePullPolicy: string; // 'Always',
                name: string; // 'hello',
                resources: {
                    limits: {
                        cpu: number; // '1',
                        memory: string; // '128Mi'
                    },
                    requests: {
                        cpu: number; // '1',
                        memory: string; // '128Mi'
                    }
                },
                terminationMessagePath: string; // '/dev/termination-log',
                terminationMessagePolicy: string; // 'File',
                volumeMounts: Array<{
                        mountPath: string; // '/var/run/secrets/kubernetes.io/serviceaccount',
                        name: string; // 'default-token-6wnf7',
                        readOnly: boolean; // true
                    }>;
            }>;
        dnsPolicy: string; // 'ClusterFirst',
        enableServiceLinks: boolean; // true,
        nodeName: string; // '10.240.128.5',
        priority: number; // 0,
        restartPolicy: string; // 'Never',
        schedulerName: string; // 'default-scheduler',
        securityContext: any,
        serviceAccount: string; // 'default',
        serviceAccountName: string; // 'default',
        terminationGracePeriodSeconds: number; // 30,
        tolerations: Array<{
                effect: string; // 'NoExecute',
                key: string; // 'node.kubernetes.io/unreachable',
                operator: string; // 'Exists',
                tolerationSeconds: number; // 600
            }>;
        volumes: Array<{
                name: string; // 'default-token-6wnf7',
                secret: {
                    defaultMode: number; // 420,
                    secretName: string; // 'default-token-6wnf7'
                }
            }>;
    };

    status: {
        conditions: IKubernetesStatusCondition[],
        containerStatuses: Array<{
                containerID: string; // 'containerd://d88fee230aedd447c7798609e28028590efba15969a3e6df200fb37ec31d3da0',
                image: string; // 'docker.io/library/busybox:latest',
                imageID: string; // 'docker.io/library/busybox@sha256:6915be4043561d64e0ab0f8f098dc2ac48e077fe23f488ac24b665166898115a',
                lastState: any,
                name: string; // 'hello',
                ready: boolean; // false,
                restartCount: number; // 0,
                state: {
                    terminated: {
                        containerID: string; // 'containerd://d88fee230aedd447c7798609e28028590efba15969a3e6df200fb37ec31d3da0',
                        exitCode: number; // 0,
                        finishedAt: string; // '2020-02-14T13:40:23Z',
                        reason: string; // 'Completed',
                        startedAt: string; // '2020-02-14T13:40:23Z'
                    }
                }
            }>;
        hostIP: string; // '10.240.128.5',
        phase: string; // 'Succeeded',
        podIP: string; // '172.30.248.252',
        qosClass: string; // 'Guaranteed',
        startTime: string; // '2020-02-14T13:40:21Z'
    };
}

export interface IKubernetesSecretRef {
    name: string;
}

export interface IKubernetesSecret {
    kind: string; // "Secret"
    apiVersion: string;
    metadata: {
        name: string;
        namespace?: string;
        uid?: string;
        creationTimestamp: string;
    };
    data?: {   // it depends on the 'type' of the secret (see below), which format the 'data' field has
        [key: string]: string;
    } | {
        'cert-chain.pem': string;
        'key.pem': string;
        'root-cert.pem': string;
    } | {
        'ca.crt': string;
        namespace: string;
        token: string;
    } | {
        '.dockerconfigjson': string;
    };
    type: string;
}

export interface IKubernetesSecrets {
    apiVersion: string;
    items: IKubernetesSecret[];
    kind: string; // "List",
    metadata: {
        resourceVersion: string;
        selfLink: string;
    };
}

export interface IKubernetesStatus {
    apiVersion: string; // "v1",
    details: {
        name: string; // "hello-jobdef-996v7",
        group: string; // "codeengine.cloud.ibm.com",
        kind: string; // "jobdefinitions",
        uid: string; // "09477c6c-bad0-49fb-9c3a-137f9e8a5a82"
    };
    kind: string; // "Status",
    metadata: any;
    status: string; // "Success",
}

export interface IKubernetesConfigMap {
    kind: string; // "ConfigMap"
    apiVersion: string;
    metadata: {
        name: string;
        namespace?: string;
        uid?: string;
        creationTimestamp: string;
    };
    data?: {   // it depends on the 'type' of the secret (see below), which format the 'data' field has
        [key: string]: string;
    };
}

export interface IKubernetesConfigMaps {
    apiVersion: string;
    items: IKubernetesConfigMap[];
    kind: string; // "List",
    metadata: {
        resourceVersion: string;
        selfLink: string;
    };
}

export interface IKubernetesResourceList {
    apiVersion: string;
    items: any[];
    kind: string; // "List",
    metadata: {
        resourceVersion: string;
        selfLink: string;
    };
}

export interface IKubernetesAPIError {
    message?: string;
    reason?: string;
    details?: string;
    status?: number;
}

export interface IResourceStats {
    id: string;
    count: number;
}
