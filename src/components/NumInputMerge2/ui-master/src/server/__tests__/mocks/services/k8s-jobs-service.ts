import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as jobModel from '../../../ts/model/job-model';
import * as k8sModel from '../../../ts/model/k8s-model';

export const JOBDEF_ID = 'some-job-678';
export const JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR = 'some-job-678_causes-backend-error';
export const JOBDEF_ID_THAT_CAUSES_ERROR = 'some-job-678_causes-error';

export const JOBRUN_ID = 'some-job--jobrun-123';
export const JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR = 'some-job--jobrun-123_causes-backend-error';
export const JOBRUN_ID_THAT_CAUSES_ERROR = 'some-job--jobrun-123_causes-error';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_1: string = 'a1aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_JOB_DEFINITION: jobModel.IJobDefinition = {
  apiVersion: jobModel.COLIGO_JOBS_API_VERSION,
  kind: 'JobDefinition',
  metadata: {
    labels: {
    },
    name: JOBDEF_ID,
  },
  spec: {
    containers: [{
      image: 'busybox',
      name: 'some-container-name',
      resources: {
        requests: {
          cpu: '1',
          memory: '512MiB',
        }
      }
    }]
  },
};

export const DUMMY_JOB_RUN: jobModel.IJobRun = {
  apiVersion: jobModel.COLIGO_JOBS_API_VERSION,
  kind: 'JobRun',
  metadata: {
    labels: {
    },
    name: JOBDEF_ID,
  },
  spec: {
    arraySize: 2,
    jobDefinitionSpec: {
      containers: [{
        image: 'busybox',
        name: 'some-container-name',
        resources: {
          requests: {
            cpu: '1',
            memory: '512MiB',
          }
        }
      }]
    },
    maxExecutionTime: 60,
    retryLimit: 3,
  },
};

export const DUMMY_JOB_DEFINITIONS: jobModel.IJobDefinitions = {
  apiVersion: jobModel.COLIGO_JOBS_API_VERSION,
  items: [DUMMY_JOB_DEFINITION],
  kind: 'List',
  metadata: {
    resourceVersion: 'some-resource-version',
    selfLink: 'some-link',
  },
};

export function getJobDefinitionOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobDefName: string): Promise<jobModel.IJobDefinition> {
  return new Promise((resolve, reject) => {
    if (jobDefName === JOBDEF_ID) {
      return resolve(DUMMY_JOB_DEFINITION);
    }

    if (jobDefName === JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getJobDefinitionsOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: k8sModel.IKubernetesQueryParameters): Promise<jobModel.IJobDefinitions> {
  return new Promise((resolve, reject) => {
    if (accessDetails.name === PROJECT_ID || PROJECT_ID_1 === accessDetails.name) {
      return resolve(DUMMY_JOB_DEFINITIONS);
    }

    if (accessDetails.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getJobRunOfNamespace(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, jobRunName: string): Promise<jobModel.IJobRun> {
  return new Promise((resolve, reject) => {
    if (jobRunName === JOBRUN_ID) {
      return resolve(DUMMY_JOB_RUN);
    }

    if (jobRunName === JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
