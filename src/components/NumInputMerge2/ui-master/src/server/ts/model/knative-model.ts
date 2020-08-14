import { IEnvVarFromList, IEnvVarList, IKubernetesStatusCondition } from './k8s-model';

export const KN_SERVING_API_GROUP = 'serving.knative.dev';
export const KN_SERVING_API_VERSION = 'v1alpha1';

export interface IKnativeServiceTemplate {
  metadata?: {
    annotations?: {
      [key: string]: any;
    },
    name: string,
  };
  spec: {
    containerConcurrency: number,
    containers: [
      {
        env?: IEnvVarList,
        envFrom?: IEnvVarFromList,
        image: string,
        resources?: {
          limits: {
            cpu?: string
            memory?: string
          },
          requests: {
            cpu?: string
            memory?: string
          }
        }
      }
    ],
    imagePullSecrets?: [
      {
        name: string,
      }
    ]
    timeoutSeconds: number,
  };
}

export interface IKnativeService {
  apiVersion?: string;
  kind: 'Service';
  metadata: {
    annotations?: {
      [key: string]: any;
    },
    creationTimestamp?: string,
    generation?: number,
    name: string,
    namespace?: string,
    uid?: string,
  };
  spec: {
    template: IKnativeServiceTemplate;
  };
  status?: {
    conditions: IKubernetesStatusCondition[],
    latestCreatedRevisionName: string;
    latestReadyRevisionName?: string;
    observedGeneration: number;
    url: string;
  };
}

export interface IKnativeRevision {
  apiVersion?: string;
  kind?: 'Revision';
  metadata: {
    annotations?: {
      [key: string]: any;
    },
    creationTimestamp?: string,
    generation?: number,
    labels?: {
      [key: string]: any;
    }
    name: string,
    namespace?: string,
    uid?: string,
  };
  spec: {
    containerConcurrency: number,
    containers: [
      {
        env?: IEnvVarList,
        envFrom?: IEnvVarFromList,
        image: string,
        resources?: {
          limits: {
            cpu?: string
            memory?: string
          },
          requests: {
            cpu?: string
            memory?: string
          }
        }
      }
    ],
    imagePullSecrets?: [
      {
        name: string,
      }
    ]
    timeoutSeconds: number,
  };
  status?: {
    conditions: IKubernetesStatusCondition[],
    observedGeneration: number;
    serviceName: string;
  };
}

export interface IKnativeConfiguration {
  status?: {
    conditions: IKubernetesStatusCondition[],
  };
}

export interface IKnativeTrafficSpec {
  latestRevision: boolean;
  percent: number;
  configurationName?: string;
  revisionName?: string;
  tag?: string;
}

export interface IKnativeTrafficStatus {
  latestRevision: boolean;
  percent: number;
  revisionName: string;
  tag?: string;
  url?: string;
}

export interface IKnativeRoute {
  apiVersion?: string;
  kind: 'Route';
  metadata: {
    annotations?: {
      'serving.knative.dev/service': string,
    },
    creationTimestamp?: string,
    name: string,
    namespace?: string,
    uid?: string,
  };
  spec: {
    traffic: IKnativeTrafficSpec[]
  };
  status: {
    address?: {
      url: string;
    };
    conditions: IKubernetesStatusCondition[];
    url: string;
    traffic?: IKnativeTrafficStatus[];
  };
}

export interface IKnativeStatus {
  apiVersion: 'v1';
  kind: 'Status';
  metadata: {
    [key: string]: any;
  };
  status: 'Success' | 'Failure' | string;
  details: {
    name: string,
    kind: 'services',
    uid: string
  };
}

// simple interface for modelling a kubernetes API List response (especially wrt pagination -> see 'metadata.continue')
export interface IResources {
  apiVersion: string;
  kind: string;
  metadata: {
    continue?: string;
  };
  items: any[];
}
