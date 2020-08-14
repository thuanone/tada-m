import * as fs from 'fs';

import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as buildModel from '../../../ts/model/build-model';
import * as k8sModel from '../../../ts/model/k8s-model';

export const BUILD_ID: string = 'some-build';
export const BUILD_ID_THAT_CAUSES_BACKEND_ERROR: string = 'some-build-causes-backend-error';
export const BUILD_ID_THAT_CAUSES_EXCEPTION: string = 'some-build-causes-exception';

export const BUILDRUN_ID: string = 'dsdfa-run-m2chl';
export const BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR: string = 'some-buildrun-causes-backend-error';
export const BUILDRUN_ID_THAT_CAUSES_EXCEPTION: string = 'some-buildrun-causes-exception';

export const PROJECT_ID: string = 'aaaaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_2: string = 'a2aaaaaa-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_BACKEND_ERROR: string = 'bbbbbbbb-369d-4f33-b46a-40808d0f98a5';
export const PROJECT_ID_THAT_CAUSES_EXCEPTION: string = 'cccccccc-369d-4f33-b46a-40808d0f98a5';

export const DUMMY_BUILD: buildModel.IBuild = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/get-build-ok.json', 'utf8'));

export const DUMMY_BUILDS: any = {
  apiVersion: 'build.dev/v1alpha1',
  items: [DUMMY_BUILD],
  kind: 'BuildList',
  metadata: {
  },
};

export const DUMMY_BUILD_DELETION_STATUS: any = {
  apiVersion: 'build.dev/v1alpha1',
  kind: 'Build',
  metadata: {},
  spec: {},
  status: {
    reason: 'Succeeded',
    registered: 'True'
  }
};

export const DUMMY_BUILDRUN: buildModel.IBuildRun = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-build/get-buildrun-ok.json', 'utf8'));

export const DUMMY_BUILDRUNS: any = {
  apiVersion: 'build.dev/v1alpha1',
  items: [DUMMY_BUILDRUN],
  kind: 'BuildRunList',
  metadata: {
  },
};

export const DUMMY_BUILDRUN_DELETION_STATUS: any = {
  apiVersion: 'build.dev/v1alpha1',
  details: {},
  kind: 'Status',
  metadata: {},
  status: 'Success',
};

export function getS2IBuilds(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: k8sModel.IKubernetesQueryParameters): Promise<buildModel.IBuilds> {
  return new Promise((resolve, reject) => {
    if (accessDetails.name === PROJECT_ID || accessDetails.name === PROJECT_ID_2) {
      return resolve(DUMMY_BUILDS);
    }

    if (accessDetails.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName: string, labelSelector?: string): Promise<buildModel.IBuild> {
  return new Promise((resolve, reject) => {
    if (resourceName === BUILD_ID) {
      return resolve(DUMMY_BUILD);
    }

    if (resourceName === BUILD_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
export function deleteS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (serviceId === BUILD_ID) {
      return resolve(DUMMY_BUILD_DELETION_STATUS);
    }

    if (serviceId === BUILD_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildToCreate: buildModel.IBuild): Promise<buildModel.IBuild> {
  return new Promise((resolve, reject) => {
    if (buildToCreate.metadata.name === BUILD_ID) {
      return resolve(DUMMY_BUILD);
    }

    if (buildToCreate.metadata.name === BUILD_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function updateS2IBuild(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildId: string, buildToUpdate: buildModel.IBuild): Promise<buildModel.IBuild> {
  return new Promise((resolve, reject) => {
    if (buildId === BUILD_ID) {
      return resolve(DUMMY_BUILD);
    }

    if (buildId === BUILD_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

// =========================================
// BuildRuns
// =========================================

export function getS2IBuildRuns(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, queryParameters?: k8sModel.IKubernetesQueryParameters): Promise<buildModel.IBuilds> {
  return new Promise((resolve, reject) => {
    if (accessDetails.name === PROJECT_ID || accessDetails.name === PROJECT_ID_2) {
      return resolve(DUMMY_BUILDRUNS);
    }

    if (accessDetails.name === PROJECT_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getS2IBuildRun(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, resourceName: string, labelSelector?: string): Promise<buildModel.IBuildRun> {
  return new Promise((resolve, reject) => {
    if (resourceName === BUILDRUN_ID) {
      return resolve(DUMMY_BUILDRUN);
    }

    if (resourceName === BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
export function deleteS2IBuildRun(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, serviceId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (serviceId === BUILDRUN_ID) {
      return resolve(DUMMY_BUILDRUN_DELETION_STATUS);
    }

    if (serviceId === BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createS2IBuildRun(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails, buildRunToCreate: buildModel.IBuildRun): Promise<buildModel.IBuildRun> {
  return new Promise((resolve, reject) => {
    if (buildRunToCreate.metadata.name === BUILDRUN_ID) {
      return resolve(DUMMY_BUILDRUN);
    }

    if (buildRunToCreate.metadata.name === BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
