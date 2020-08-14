import * as commonErrors from '../../../../common/Errors';
import * as buildModel from '../../../../common/model/build-model';
import * as commonModel from '../../../../common/model/common-model';
import * as middlewareUtils from '../../../ts/utils/middleware-utils';

export const RESOURCE_GROUP_ID: string = '11111111369d4f33b46a40808d0f98a5'; // pragma: allowlist secret

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

export const BUILD_ID: string = 'valid-buildid';
export const BUILD_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-buildid-but-backendfails';
export const BUILD_ID_THAT_CAUSES_ERROR: string = 'valid-buildid-but-exception';

export const BUILDRUN_ID: string = 'valid-buildid';
export const BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-buildid-but-backendfails';
export const BUILDRUN_ID_THAT_CAUSES_ERROR: string = 'valid-buildid-but-exception';

export const DUMMY_BUILD_FOR_CREATION: buildModel.IUIBuild = {
  id: BUILD_ID,
  kind: commonModel.UIEntityKinds.BUILD,
  name: BUILD_ID,
  outputCredentials: 'some-creds',
  outputImage: 'us.icr.io/somme/repo:image',
  regionId: REGION_ID,
  sourceUrl: 'https://github.com/org/name',
  strategyKind: 'ClusterBuildStrategy',
  strategyName: 'kaniko',
};

export const DUMMY_BUILD: buildModel.IUIBuild = {
  id: 'foo',
  kind: commonModel.UIEntityKinds.BUILD,
  name: BUILD_ID,
  outputCredentials: 'some-creds',
  outputImage: 'us.icr.io/somme/repo:image',
  regionId: REGION_ID,
  sourceUrl: 'https://github.com/org/name',
  strategyKind: 'ClusterBuildStrategy',
  strategyName: 'kaniko',
};

export const DUMMY_BUILDRUN_FOR_CREATION: buildModel.IUIBuildRun = {
  buildRef: BUILD_ID,
  id: undefined,
  kind: commonModel.UIEntityKinds.BUILDRUN,
  name: BUILDRUN_ID,
};

export const DUMMY_BUILDRUN: buildModel.IUIBuildRun = {
  buildRef: BUILD_ID,
  id: 'foo',
  kind: commonModel.UIEntityKinds.BUILDRUN,
  name: BUILDRUN_ID,
};

export function getBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId: string): Promise<buildModel.IUIBuild> {
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

export function listBuilds(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<buildModel.IUIBuild[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_BUILD]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildToCreate: buildModel.IUIBuild): Promise<buildModel.IUIBuild> {
  return new Promise((resolve, reject) => {
    if (buildToCreate && buildToCreate.name === BUILD_ID) {
      return resolve(DUMMY_BUILD);
    }

    if (buildToCreate && buildToCreate.name === BUILD_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId: string): Promise<commonModel.IUIOperationResult> {
  return new Promise((resolve, reject) => {
    if (buildId === BUILD_ID) {
      // craft a UIOperationResult
      const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);
      return resolve(operationResult);
    }

    if (buildId === BUILD_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function updateBuild(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildId: string, buildToUpdate: buildModel.IUIBuild): Promise<buildModel.IUIBuild> {
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

export function getBuildRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildRunId: string): Promise<buildModel.IUIBuildRun> {
  return new Promise((resolve, reject) => {
    if (buildRunId === BUILDRUN_ID) {
      return resolve(DUMMY_BUILDRUN);
    }

    if (buildRunId === BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listBuildRuns(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<buildModel.IUIBuildRun[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_BUILDRUN]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createBuildRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildRunToCreate: buildModel.IUIBuildRun): Promise<buildModel.IUIBuildRun> {
  return new Promise((resolve, reject) => {
    if (buildRunToCreate && buildRunToCreate.name === BUILDRUN_ID) {
      return resolve(DUMMY_BUILDRUN);
    }

    if (buildRunToCreate && buildRunToCreate.name === BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteBuildRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, buildRunId: string): Promise<commonModel.IUIOperationResult> {
  return new Promise((resolve, reject) => {
    if (buildRunId === BUILDRUN_ID) {
      // craft a UIOperationResult
      const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);
      return resolve(operationResult);
    }

    if (buildRunId === BUILDRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
