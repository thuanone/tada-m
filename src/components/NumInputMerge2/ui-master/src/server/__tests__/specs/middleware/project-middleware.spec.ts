// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as projModel from '../../../../common/model/project-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as coligoServiceMock from '../../mocks/services/coligo-service';
import * as resourceControllerServiceMock from '../../mocks/services/resoure-controller-service';

const coligoUtilsMock = {
  getRegions: () => {
    return [{ id: resourceControllerServiceMock.REGION_ID }, { id: resourceControllerServiceMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR }];
  },
};

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'some-tid',
  };
}

describe('project middleware', () => {
  let projectMiddleware;

  // store all environment variables that are gonna changed for this unit test
  const origColigoPerfMonitoringDisabled = process.env.coligoPerfMonitoringDisabled;
  const origColigoPerfLoggingDisabled = process.env.coligoPerfLoggingDisabled;
  const origColigoResourcePlanId = process.env.coligoResourcePlanId;
  const origNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {

    // disable performance logging and monitoring to avoid log polution
    process.env.coligoPerfMonitoringDisabled = 'true';
    process.env.coligoPerfLoggingDisabled = 'true';

    projectMiddleware = proxyquire('../../../ts/middleware/project-middleware', {
      '../services/coligo-service': coligoServiceMock,
      '../services/resource-controller-service': resourceControllerServiceMock,
      '../utils/coligo-utils': coligoUtilsMock,
      '../utils/logger-utils': loggerUtilMock,
    });
  });

  afterEach(() => {

    // restore the resource plan id
    delete process.env.coligoResourcePlanId;
    process.env.coligoResourcePlanId = origColigoResourcePlanId;

    // reset the environment variables
    process.env.NODE_ENV = origNodeEnv;
  });

  afterAll(() => {
    // reset the environment variables
    process.env.coligoPerfMonitoringDisabled = origColigoPerfMonitoringDisabled;
    process.env.coligoPerfLoggingDisabled = origColigoPerfLoggingDisabled;
  });

  it('should return a list of resource groups', (done) => {

    projectMiddleware.listResourceGroups(getRequestContextMock()).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(1);
      expect(result[0]).toBeDefined();
      expect(result[0].name).toBeDefined();
      expect(result[0].name).toMatch(resourceControllerServiceMock.DUMMY_RESOURCE_GROUP.name);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should throw an error in case something went wrong', (done) => {

    projectMiddleware.listResourceGroups(undefined).catch((err) => {
      expect(err._code).toEqual(103012);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should return a list of regions', (done) => {

    projectMiddleware.listRegions(getRequestContextMock()).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(2);
      expect(result[0].id).toEqual(resourceControllerServiceMock.REGION_ID);
      expect(result[1].id).toEqual(resourceControllerServiceMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should return a list of projects', (done) => {

    const regionId = resourceControllerServiceMock.REGION_ID;

    projectMiddleware.listProjects(getRequestContextMock(), regionId).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(1);
      expect(result[0]).toBeDefined();
      expect(result[0].id).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.guid);
      expect(result[0].kind).toEqual(commonModel.UIEntityKinds.PROJECT);
      expect(result[0].resourceGroupId).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.resource_group_id);
      expect(result[0].resourcePlanId).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.resource_plan_id);
      expect(result[0].state).toEqual('PROVISIONING');
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should return an error in case the unknown error has been caught', (done) => {

    const regionId = resourceControllerServiceMock.REGION_ID_THAT_CAUSES_ERROR;

    projectMiddleware.listProjects(getRequestContextMock(), regionId).catch((err) => {
      expect(err._code).toEqual(103001);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should re-throw an error that was thrown by the backend service', (done) => {

    const regionId = resourceControllerServiceMock.REGION_ID_THAT_CAUSES_BACKEND_ERROR;

    projectMiddleware.listProjects(getRequestContextMock(), regionId).catch((err) => {
      expect(err._code).toEqual(100002);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should return a project', (done) => {

    const projectId = resourceControllerServiceMock.PROJECT_ID;
    const regionId = 'some';

    projectMiddleware.getProject(getRequestContextMock(), projectId, regionId).then((result) => {
      expect(result).toBeDefined();
      expect(result.id).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.guid);
      expect(result.kind).toEqual(commonModel.UIEntityKinds.PROJECT);
      expect(result.resourceGroupId).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.resource_group_id);
      expect(result.resourcePlanId).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.resource_plan_id);
      expect(result.state).toEqual('PROVISIONING');
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should return an error in case the unknown error has been caught', (done) => {

    const projectId = resourceControllerServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    projectMiddleware.getProject(getRequestContextMock(), projectId, regionId).catch((err) => {
      expect(err._code).toEqual(103002);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should re-throw an error that was thrown by the backend service', (done) => {

    const projectId = resourceControllerServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = 'some';

    projectMiddleware.getProject(getRequestContextMock(), projectId, regionId).catch((err) => {
      expect(err._code).toEqual(100002);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should create a project', (done) => {

    const projectToCreate: projModel.IUIProject = {
      crn: undefined,
      id: resourceControllerServiceMock.PROJECT_ID,
      kind: commonModel.UIEntityKinds.PROJECT,
      name: resourceControllerServiceMock.PROJECT_ID,
      region: resourceControllerServiceMock.REGION_ID,
    };

    // the resource plan id is configured as env variable
    process.env.coligoResourcePlanId = 'some-planid';

    projectMiddleware.createProject(getRequestContextMock(), projectToCreate)
      .then((result) => {
        expect(result).toBeDefined();
        expect(result.id).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.guid);
        expect(result.kind).toEqual(commonModel.UIEntityKinds.PROJECT);
        expect(result.resourceGroupId).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.resource_group_id);
        expect(result.resourcePlanId).toEqual(resourceControllerServiceMock.DUMMY_PROJECT_RESOURCE.resource_plan_id);
        expect(result.state).toEqual('PROVISIONING');
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('project creation fails due to missing resource plan id', (done) => {

    const projectToCreate: projModel.IUIProject = {
      crn: undefined,
      id: resourceControllerServiceMock.PROJECT_ID,
      kind: commonModel.UIEntityKinds.PROJECT,
      name: resourceControllerServiceMock.PROJECT_ID,
      region: resourceControllerServiceMock.REGION_ID,
    };

    process.env.coligoResourcePlanId = 'RESOURCE_PLAN_NOT_SET';

    projectMiddleware.createProject(getRequestContextMock(), projectToCreate)
      .then((result) => {
        console.info(JSON.stringify(result));
        done.fail(new Error('should not reach that point'));
      })
      .catch((err) => {
        expect(err._code).toEqual(103014);
        done();
      })
      .catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service', (done) => {

    const projectToCreate: projModel.IUIProject = {
      crn: undefined,
      id: resourceControllerServiceMock.PROJECT_ID,
      kind: commonModel.UIEntityKinds.PROJECT,
      name: resourceControllerServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR,
      region: resourceControllerServiceMock.REGION_ID,
      resourcePlanId: 'some-plan',
    };

    // the resource plan id is configured as env variable
    process.env.coligoResourcePlanId = 'some-planid';

    projectMiddleware.createProject(getRequestContextMock(), projectToCreate)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      })
      .catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the unknown error has been caught', (done) => {

    const projectToCreate: projModel.IUIProject = {
      crn: undefined,
      id: resourceControllerServiceMock.PROJECT_ID,
      kind: commonModel.UIEntityKinds.PROJECT,
      name: resourceControllerServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION,
      region: resourceControllerServiceMock.REGION_ID,
      resourcePlanId: 'some-plan',
    };

    // the resource plan id is configured as env variable
    process.env.coligoResourcePlanId = 'some-planid';

    projectMiddleware.createProject(getRequestContextMock(), projectToCreate)
      .catch((err) => {
        expect(err._code).toEqual(103015);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should delete a project', (done) => {

    const projectId = resourceControllerServiceMock.PROJECT_ID;

    projectMiddleware.deleteProject(getRequestContextMock(), projectId)
      .then((result) => {
        expect(result).toBeDefined();
        expect(result).toEqual(jasmine.objectContaining({ status: 'OK' }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should re-throw an error that was thrown by the backend service', (done) => {

    const projectId = resourceControllerServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;

    projectMiddleware.deleteProject(getRequestContextMock(), projectId)
      .catch((err) => {
        expect(err._code).toEqual(103016);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return an error in case the unknown error has been caught', (done) => {

    const projectId = resourceControllerServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;

    projectMiddleware.deleteProject(getRequestContextMock(), projectId)
      .catch((err) => {
        expect(err._code).toEqual(100002);
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('should return the project status (getProjectStatus)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID;
    const regionId = 'some';

    projectMiddleware.getProjectStatus(getRequestContextMock(), projectId, regionId).then((result) => {
      expect(result).toBeDefined();
      expect(result.domain).toEqual(true);
      expect(result.tenant).toEqual(true);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should return an error in case the unknown error has been caught (getProjectStatus)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_EXCEPTION;
    const regionId = 'some';

    projectMiddleware.getProjectStatus(getRequestContextMock(), projectId, regionId).catch((err) => {
      expect(err._code).toEqual(103020);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('should re-throw an error that was thrown by the backend service (getProjectStatus)', (done) => {

    const projectId = coligoServiceMock.PROJECT_ID_THAT_CAUSES_BACKEND_ERROR;
    const regionId = 'some';

    projectMiddleware.getProjectStatus(getRequestContextMock(), projectId, regionId).catch((err) => {
      expect(err._code).toEqual(106001);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

});
