import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as jobModel from '../../../../common/model/job-model';

export const RESOURCE_GROUP_ID: string = '11111111369d4f33b46a40808d0f98a5';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

export const JOBDEF_ID: string = 'valid-jobdefid';
export const JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-jobdefid-but-backendfails';
export const JOBDEF_ID_THAT_CAUSES_ERROR: string = 'valid-jobdefid-but-exception';

export const JOBRUN_ID: string = 'valid-jobrunid';
export const JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-jobrunid-but-backendfails';
export const JOBRUN_ID_THAT_CAUSES_ERROR: string = 'valid-jobrunid-but-exception';

export const DUMMY_JOBDEF_FOR_CREATION: jobModel.IUIJobDefinition = {
  id: JOBDEF_ID,
  kind: commonModel.UIEntityKinds.JOBDEFINITION,
  name: JOBDEF_ID,
  spec: {
    cpus: 1,
    image: 'busybox',
    memory: 536870912,
  },
};

export const DUMMY_JOBRUN_FOR_CREATION: jobModel.IUIJobRun = {
  arraySpec: '1',
  definitionName: JOBDEF_ID,
  id: JOBRUN_ID,
  kind: commonModel.UIEntityKinds.JOBRUN,
  maxExecutionTime: 10,
  name: JOBRUN_ID,
  retryLimit: 1,
  spec: {
    cpus: 1,
    image: 'busybox',
    memory: 536870912,
  },
};

export const DUMMY_JOBDEF: jobModel.IUIJobDefinition = {
  id: 'foo',
  kind: commonModel.UIEntityKinds.JOBDEFINITION,
  name: 'foo',
  spec: {
    cpus: 1,
    image: 'busybox',
    memory: 536870912,
  },
};

export const DUMMY_JOBRUN: jobModel.IUIJobRun = {
  arraySpec: '1',
  id: 'foo1',
  kind: commonModel.UIEntityKinds.JOBRUN,
  maxExecutionTime: 10,
  name: 'foo1',
};

export function getJobDefinition(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, jobDefName: string): Promise<jobModel.IUIJobDefinition> {
  return new Promise((resolve, reject) => {
    if (jobDefName === JOBDEF_ID) {
      return resolve(DUMMY_JOBDEF);
    }

    if (jobDefName === JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listJobDefinitions(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<jobModel.IUIJobDefinitions> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_JOBDEF]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createJobDefinition(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, uiJobDef: jobModel.IUIJobDefinition): Promise<jobModel.IUIJobDefinition> {
  return new Promise((resolve, reject) => {
    if (uiJobDef && uiJobDef.name === JOBDEF_ID) {
      return resolve(DUMMY_JOBDEF);
    }

    if (uiJobDef && uiJobDef.name === JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function updateJobDefinition(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, uiJobDef: jobModel.IUIJobDefinition): Promise<jobModel.IUIJobDefinition> {
  return new Promise((resolve, reject) => {
    if (uiJobDef && uiJobDef.name === JOBDEF_ID) {
      return resolve(DUMMY_JOBDEF);
    }

    if (uiJobDef && uiJobDef.name === JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteJobDefinition(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, jobDefName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (jobDefName === JOBDEF_ID) {
      return resolve({});
    }

    if (jobDefName === JOBDEF_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getJobRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, jobRunName: string): Promise<jobModel.IUIJobRun> {
  return new Promise((resolve, reject) => {
    if (jobRunName === JOBRUN_ID) {
      return resolve(DUMMY_JOBRUN);
    }

    if (jobRunName === JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listJobRuns(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, jobDefinitionName?: string): Promise<jobModel.IUIJobRuns> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_JOBRUN]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createJobRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, uiJobRun: jobModel.IUIJobRun): Promise<jobModel.IUIJobRun> {
  return new Promise((resolve, reject) => {
    if (uiJobRun && uiJobRun.name === JOBRUN_ID) {
      return resolve(DUMMY_JOBRUN);
    }

    if (uiJobRun && uiJobRun.name === JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteJobRun(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, jobRunName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (jobRunName === JOBRUN_ID) {
      return resolve({});
    }

    if (jobRunName === JOBRUN_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}
