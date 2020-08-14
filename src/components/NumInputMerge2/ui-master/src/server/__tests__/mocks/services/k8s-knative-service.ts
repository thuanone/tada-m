import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as k8sModel from '../../../ts/model/k8s-model';
import * as knativeModel from '../../../ts/model/knative-model';

export const SERVICE_ID: string = 'some-service';
export const SERVICE_ID_THAT_CAUSES_BACKEND_ERROR: string = 'some-service-causes-backend-error';
export const SERVICE_ID_THAT_CAUSES_EXCEPTION: string = 'some-service-causes-exception';
export const REVISION_ID: string = 'some-service-revision';
export const REVISION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'some-service-revision-causes-backend-error';
export const REVISION_ID_THAT_CAUSES_EXCEPTION: string = 'some-service-revision-causes-exception';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_2: string = 'a2aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_KN_SERVICE: knativeModel.IKnativeService = {
  apiVersion: knativeModel.KN_SERVING_API_VERSION,
  kind: 'Service',
  metadata: {
    name: SERVICE_ID,
  },
  spec: {
    template: {
      spec: {
        containerConcurrency: 10,
        containers: [{
          image: 'ibmcom/kn-helloworld',
          resources: {
            limits: {
              cpu: '1',
              memory: '512MiB',
            },
            requests: {
              cpu: '1',
              memory: '512MiB',
            },
          },
        }],
        timeoutSeconds: 300,
      }
    }
  },
  status: {
    conditions: undefined,
    latestCreatedRevisionName: REVISION_ID,
    observedGeneration: 1,
    url: 'https://some.url.endpoint',
  },
};

export const DUMMY_KN_SERVICE_REVISION: knativeModel.IKnativeRevision = {
  metadata: {
    name: REVISION_ID,
  },
  spec: {
    containerConcurrency: 10,
    containers: [{
      image: 'ibmcom/kn-helloworld',
      resources: {
        limits: {
          cpu: '1',
          memory: '512MiB',
        },
        requests: {
          cpu: '1',
          memory: '512MiB',
        },
      },
    }],
    timeoutSeconds: 300,
  }
};

export const DUMMY_KN_SERVICE_ROUTE: knativeModel.IKnativeRoute = {
  kind: 'Route',
  metadata: {
    name: SERVICE_ID,
  },
  spec: {
    traffic: [
      {
        latestRevision: true,
        percent: 100,
      }
    ]
  },
  status: {
    conditions: [],
    traffic: [{
      latestRevision: true,
      percent: 100,
      revisionName: REVISION_ID,
    }],
    url: 'https://some.service.url/route',
  }
};

export const DUMMY_KN_SERVICES: knativeModel.IResources = {
  apiVersion: knativeModel.KN_SERVING_API_VERSION,
  items: [DUMMY_KN_SERVICE],
  kind: 'List',
  metadata: {
  },
};

export const DUMMY_DELETION_STATUS: knativeModel.IKnativeStatus = {
  apiVersion: 'v1',
  details: {
    kind: 'services',
    name: SERVICE_ID,
    uid: SERVICE_ID,
  },
  kind: 'Status',
  metadata: {},
  status: 'Success',
};

export function getKnServicesOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: k8sModel.IKubernetesQueryParameters): Promise<knativeModel.IResources> {
  return new Promise((resolve, reject) => {
    if (accessDetails.name === PROJECT_ID || accessDetails.name === PROJECT_ID_2) {
      return resolve(DUMMY_KN_SERVICES);
    }

    if (accessDetails.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getKnService(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName: string, labelSelector?: string): Promise<knativeModel.IKnativeService> {
  return new Promise((resolve, reject) => {
    if (serviceName === SERVICE_ID) {
      return resolve(DUMMY_KN_SERVICE);
    }

    if (serviceName === SERVICE_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getKnServiceRevision(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, revisionName, labelSelector?: string): Promise<knativeModel.IKnativeRevision> {
  return new Promise((resolve, reject) => {
    if (revisionName === REVISION_ID) {
      return resolve(DUMMY_KN_SERVICE_REVISION);
    }

    if (revisionName === REVISION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getKnServiceRevisions(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName, labelSelector?: string): Promise<knativeModel.IKnativeRevision[]> {
  return new Promise((resolve, reject) => {
    if (serviceName === SERVICE_ID) {
      return resolve([DUMMY_KN_SERVICE_REVISION]);
    }

    if (serviceName === SERVICE_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getKnServiceRoute(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceName, labelSelector?: string) {
  return new Promise((resolve, reject) => {
    if (serviceName === SERVICE_ID) {
      return resolve(DUMMY_KN_SERVICE_ROUTE);
    }

    if (serviceName === SERVICE_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteKnService(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string): Promise<knativeModel.IKnativeStatus> {
  return new Promise((resolve, reject) => {
    if (serviceId === SERVICE_ID) {
      return resolve(DUMMY_DELETION_STATUS);
    }

    if (serviceId === SERVICE_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createKnService(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceToCreate: knativeModel.IKnativeService): Promise<knativeModel.IKnativeService> {
  return new Promise((resolve, reject) => {
    if (serviceToCreate.metadata.name === SERVICE_ID) {
      return resolve(DUMMY_KN_SERVICE);
    }

    if (serviceToCreate.metadata.name === SERVICE_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createKnServiceRevision(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string, knService: knativeModel.IKnativeService): Promise<knativeModel.IKnativeService> {
  return new Promise((resolve, reject) => {
    if (serviceId === SERVICE_ID) {
      return resolve(DUMMY_KN_SERVICE);
    }

    if (serviceId === SERVICE_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
