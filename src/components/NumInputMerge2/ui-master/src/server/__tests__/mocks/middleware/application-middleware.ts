import * as commonErrors from '../../../../common/Errors';
import * as appModel from '../../../../common/model/application-model';
import * as commonModel from '../../../../common/model/common-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as middlewareUtils from '../../../ts/utils/middleware-utils';

export const RESOURCE_GROUP_ID: string = '11111111369d4f33b46a40808d0f98a5';

export const REGION_ID: string = 'valid-regionId';
export const REGION_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-regionId_backendfails';

export const APP_ID: string = 'valid-appid';
export const APP_ID_THAT_CAUSES_BACKEND_ERROR: string = 'valid-appid-but-backendfails';
export const APP_ID_THAT_CAUSES_ERROR: string = 'valid-appid-but-exception';

export const DUMMY_APP_FOR_CREATION: appModel.IUIApplication = {
  id: APP_ID,
  kind: commonModel.UIEntityKinds.APPLICATION,
  name: APP_ID,
  regionId: REGION_ID,
  template: {
    cpus: coligoValidatorConfig.default.application.cpu.default,
    image: 'ibmcom/kn-helloworld',
    maxScale: coligoValidatorConfig.default.application.maxScale.default,
    memory: coligoValidatorConfig.default.application.memory.default,
    minScale: coligoValidatorConfig.default.application.minScale.default,
    timeoutSeconds: coligoValidatorConfig.default.application.timeout.default,
    containerConcurrency: coligoValidatorConfig.default.application.containerConcurrency.default,
  }
};

export const DUMMY_APP_REVISION_FOR_CREATION: appModel.IUIApplicationRevision = {
  id: 'foo1',
  kind: commonModel.UIEntityKinds.APPLICATIONREVISION,
  name: 'foo1',
  regionId: REGION_ID,

  containerConcurrency: coligoValidatorConfig.default.application.containerConcurrency.default,
  cpus: coligoValidatorConfig.default.application.cpu.default,
  image: 'ibmcom/kn-helloworld',
  maxScale: coligoValidatorConfig.default.application.maxScale.default,
  memory: coligoValidatorConfig.default.application.memory.default,
  minScale: coligoValidatorConfig.default.application.minScale.default,
  timeoutSeconds: coligoValidatorConfig.default.application.timeout.default,
};

export const DUMMY_APP: appModel.IUIApplication = {
  id: 'foo',
  kind: commonModel.UIEntityKinds.APPLICATION,
  name: 'foo',
  regionId: 'some-region',
};

export const DUMMY_PAYLOAD_FOR_INVOCATION: appModel.IUIApplicationInvocation = {
  url: 'https://foo.bar.com',
};

export const DUMMY_INVOCATION_RESULT: appModel.IUIApplicationInvocationResult = {
    durationInMillis: 30,
    endTime: Date.now(),
    responseBody: 'Hello World!',
};

export const DUMMY_APP_ROUTE: appModel.IUIApplicationRoute = {
  routingTags: {
    foo1: [ 'some', 'tags'],
  },
  trafficTargets: {
    foo1: 100,
  },
};

export const DUMMY_APP_REVISION: appModel.IUIApplicationRevision = {
  id: 'foo1',
  kind: commonModel.UIEntityKinds.APPLICATIONREVISION,
  name: 'foo1',
  regionId: 'some-region',
};

export const DUMMY_APP_INSTANCE: appModel.IUIApplicationInstance = {
  application: 'foo',
  created: Date.now(),
  id: 'foo',
  name: 'foo',
  revision: 'some-region',
  statusPhase: 'Running',
};

export function getApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicatonId: string): Promise<appModel.IUIApplication> {
  return new Promise((resolve, reject) => {
    if (applicatonId === APP_ID) {
      return resolve(DUMMY_APP);
    }

    if (applicatonId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listApplications(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<appModel.IUIApplication[]> {
  return new Promise((resolve, reject) => {
    if (regionId === REGION_ID) {
      return resolve([DUMMY_APP]);
    }

    if (regionId === REGION_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listApplicationRevisions(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicatonId: string): Promise<appModel.IUIApplicationRevision[]> {
  return new Promise((resolve, reject) => {
    if (applicatonId === APP_ID) {
      return resolve([DUMMY_APP_REVISION]);
    }

    if (applicatonId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listApplicationInstances(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicatonId: string): Promise<appModel.IUIApplicationInstance[]> {
  return new Promise((resolve, reject) => {
    if (applicatonId === APP_ID) {
      return resolve([DUMMY_APP_INSTANCE]);
    }

    if (applicatonId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function getApplicationRoute(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicatonId: string): Promise<appModel.IUIApplicationRoute>  {
  return new Promise((resolve, reject) => {
    if (applicatonId === APP_ID) {
      return resolve(DUMMY_APP_ROUTE);
    }

    if (applicatonId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicatonToCreate: appModel.IUIApplication): Promise<appModel.IUIApplication> {
  return new Promise((resolve, reject) => {
    if (applicatonToCreate && applicatonToCreate.name === APP_ID) {
      return resolve(DUMMY_APP);
    }

    if (applicatonToCreate && applicatonToCreate.name === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function createApplicationRevision(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string, appRevisionToCreate: appModel.IUIApplicationRevision): Promise<appModel.IUIApplication> {
  return new Promise((resolve, reject) => {
    if (applicationId === APP_ID) {
      return resolve(DUMMY_APP);
    }

    if (applicationId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function deleteApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string): Promise<commonModel.IUIOperationResult> {
  return new Promise((resolve, reject) => {
    if (applicationId === APP_ID) {
      // craft a UIOperationResult
      const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);
      return resolve(operationResult);
    }

    if (applicationId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function invokeApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string, invocationPayload: appModel.IUIApplicationInvocation): Promise<appModel.IUIApplicationInvocationResult> {
  return new Promise((resolve, reject) => {
    if (applicationId === APP_ID) {
      return resolve(DUMMY_INVOCATION_RESULT);
    }

    if (applicationId === APP_ID_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

