import * as fs from 'fs';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

// regular imports
import * as commonModel from '../../../../common/model/common-model';
import * as accessDetailsModel from '../../../ts/model/access-details-model';
import * as jobModel from '../../../ts/model/job-model';
import * as k8sModel from '../../../ts/model/k8s-model';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error: any = undefined;
    let response;
    let body;

    response = {
      statusCode: 500,
    };

    //
    // jobdefinition
    if (options.path.indexOf('/jobdefinitions/') > -1) {
      if (options.method === 'GET') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else if (options.headers.Authorization.indexOf('malformed') > -1) {
          response = {
            statusCode: 200
          };

          body = '{ "foo": "bar" }';
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/get-jobdef_response-ok.json', 'utf8');
        }
      } else if (options.method === 'DELETE') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/delete-jobdef_response-ok.json', 'utf8');
        }
      } else if (options.method === 'PATCH') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/update-jobdef_response-ok.json', 'utf8');
        }
      }

      //
      // jobdefinitions
    } else if (options.path.indexOf('/jobdefinitions') > -1) {
      if (options.method === 'GET') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else if (options.headers.Authorization.indexOf('empty') > -1) {
          response = {
            statusCode: 200
          };
          body = '{}';
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/get-jobdefs_response-ok.json', 'utf8');
        }
      } else if (options.method === 'POST') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/create-jobdef_response-ok.json', 'utf8');
        }
      }
    }

    //
    // jobrun
    if (options.path.indexOf('/jobruns/') > -1) {
      if (options.method === 'GET') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else if (options.headers.Authorization.indexOf('malformed') > -1) {
          response = {
            statusCode: 200
          };

          body = '{ "foo": "bar" }';
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/get-jobrun_response-ok.json', 'utf8');
        }
      } else if (options.method === 'DELETE') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/delete-jobrun_response-ok.json', 'utf8');
        }
      } else if (options.method === 'PATCH') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/update-jobrun_response-ok.json', 'utf8');
        }
      }

      //
      // jobruns
    } else if (options.path.indexOf('/jobruns') > -1) {
      if (options.method === 'GET') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else if (options.headers.Authorization.indexOf('empty') > -1) {
          response = {
            statusCode: 200
          };
          body = '{}';
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/get-jobruns_response-ok.json', 'utf8');
        }
      } else if (options.method === 'POST') {
        if (options.headers.Authorization.indexOf('invalid') > -1) {
          response = {
            statusCode: 500
          };
        } else {
          response = {
            statusCode: 200
          };
          body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-jobs/create-jobrun_response-ok.json', 'utf8');
        }
      }
    }

    callbackFn(error, response, body);
  }
};

const monitoringUtilsMock = {
  createPerfLogEntry: (...args) => {
    // relax and take it easy
  },
  storePerfMonitorEntry: (...args) => {
    // relax and take it easy
  }
};

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'foo',
    user: {}
  } as commonModel.IUIRequestContext;
}

function getAccessDetailsMock(iamToken?: string): accessDetailsModel.IAccessDetails {
  return {
    accessToken: iamToken || 'bar',
    name: 'foo',
    serviceEndpointBaseUrl: 'https://some.coligo.serving.backend',
  } as accessDetailsModel.IAccessDetails;
}

describe('k8sJobsService', () => {
  let k8sJobsService;

  beforeEach(() => {

    k8sJobsService = proxyquire('../../../ts/services/k8s-jobs-service', {
      '../utils/http-utils' : proxyquire('../../../ts/utils/http-utils', {
        './logger-utils': loggerUtilMock,
      }),
      '../utils/logger-utils': loggerUtilMock,
      './../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('retrieves a job definition (getJobDefinitionOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobDefId = 'some-jobdef';

    return k8sJobsService.getJobDefinitionOfNamespace(ctx, accessDetails, jobDefId)
      .then((jobdef: jobModel.IJobDefinition) => {
        expect(jobdef).toBeDefined();
        expect(jobdef.metadata.name).toEqual('some-new-job-pjw4v');
        done();
      }).catch((e) =>
        done.fail(e)
      );
  });

  it('throws an error in case the given jobdefId is not set properly (getJobDefinitionOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobDefId = undefined;

    return k8sJobsService.getJobDefinitionOfNamespace(ctx, accessDetails, jobDefId)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetJobDefError', _code: 102003 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('throws an error in case the jobdefinition does not exist (getJobDefinitionOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobDefId = 'some-jobdef';

    return k8sJobsService.getJobDefinitionOfNamespace(ctx, accessDetails, jobDefId)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetJobDefError', _code: 102003 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('retrieves job definitions (getJobDefinitionsOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();

    return k8sJobsService.getJobDefinitionsOfNamespace(ctx, accessDetails)
      .then((jobdefs: jobModel.IJobDefinitions) => {
        expect(jobdefs).toBeDefined();
        expect(jobdefs.items).toBeDefined();
        expect(jobdefs.items.length).toEqual(1);
        expect(jobdefs.items[0].metadata.name).toEqual('my-new-job-mdhx8');
        done();
      }).catch((e) =>
        done.fail(e)
      );
  });

  it('returns an object with an empty list in case the server responded with a 200 and malformed content (getJobDefinitionsOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('empty');

    return k8sJobsService.getJobDefinitionsOfNamespace(ctx, accessDetails)
      .then((jobdefs: jobModel.IJobDefinitions) => {
        expect(jobdefs).toBeDefined();
        expect(jobdefs.items).toBeDefined();
        expect(jobdefs.items.length).toEqual(0);
        done();
      }).catch((e) =>
        done.fail(e)
      );
  });

  it('throws an exception in case the backend returns an error (getJobDefinitionsOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');

    return k8sJobsService.getJobDefinitionsOfNamespace(ctx, accessDetails)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetJobDefsError', _code: 102002 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('deletes a job definition (deleteJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobDefName = 'foo';

    return k8sJobsService.deleteJobDefinitionInNamespace(ctx, accessDetails, jobDefName)
      .then((opStatus: k8sModel.IKubernetesStatus) => {
        expect(opStatus).toBeDefined();
        expect(opStatus.status).toEqual('Success');
        done();
      }).catch((e) => {
        done.fail(e);
      }
      );
  });

  it('throws an exception in case the given jobdefid is not set properly (deleteJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobDefName = undefined;

    return k8sJobsService.deleteJobDefinitionInNamespace(ctx, accessDetails, jobDefName)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToDeleteJobDefError', _code: 102009 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('throws an exception in case the backend returns an error (deleteJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobDefName = 'something';

    return k8sJobsService.deleteJobDefinitionInNamespace(ctx, accessDetails, jobDefName)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToDeleteJobDefError', _code: 102009 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('updates a job definition (updateJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobDefToUpdate = {
      metadata: {
        name: 'foo',
      }
    };

    return k8sJobsService.updateJobDefinitionInNamespace(ctx, accessDetails, jobDefToUpdate)
      .then((jobdef: jobModel.IJobDefinition) => {
        expect(jobdef).toBeDefined();
        expect(jobdef.metadata.name).toEqual('some-new-job-pjw4v');
        done();
      }).catch((e) => {
        done.fail(e);
      }
      );
  });

  it('throws an exception in case the given jobdefintion is undefined (updateJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobDefToUpdate = undefined;

    return k8sJobsService.updateJobDefinitionInNamespace(ctx, accessDetails, jobDefToUpdate)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToUpdateJobDefError', _code: 102007 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('throws an exception in case the backend returns an error (updateJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobDefToUpdate = {
      metadata: {
        name: 'foo',
      }
    };

    return k8sJobsService.updateJobDefinitionInNamespace(ctx, accessDetails, jobDefToUpdate)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToUpdateJobDefError', _code: 102007 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('creates a job definition (createJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobDefToCreate = {
      metadata: {
        name: 'foo',
      }
    };

    return k8sJobsService.createJobDefinitionInNamespace(ctx, accessDetails, jobDefToCreate)
      .then((jobdef: jobModel.IJobDefinition) => {
        expect(jobdef).toBeDefined();
        expect(jobdef.metadata.name).toEqual('my-new-job-mdhx8');
        done();
      }).catch((e) => {
        done.fail(e);
      }
      );
  });

  it('throws an exception in case the given jobdefintion is undefined (createJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobDefToCreate = undefined;

    return k8sJobsService.createJobDefinitionInNamespace(ctx, accessDetails, jobDefToCreate)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateJobDefError', _code: 102006 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('throws an exception in case the backend returns an error (createJobDefinitionInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobDefToCreate = {
      metadata: {
        name: 'foo',
      }
    };

    return k8sJobsService.createJobDefinitionInNamespace(ctx, accessDetails, jobDefToCreate)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateJobDefError', _code: 102006 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  // ============

  it('retrieves a job run (getJobRunOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobRunId = 'some-jobdef';

    return k8sJobsService.getJobRunOfNamespace(ctx, accessDetails, jobRunId)
      .then((jobrun: jobModel.IJobRun) => {
        expect(jobrun).toBeDefined();
        expect(jobrun.metadata.name).toEqual('some-new-job-pjw4v-jobrun-wd7mg');
        done();
      }).catch((e) =>
        done.fail(e)
      );
  });

  it('throws an error in case the given jobrunId is not set properly (getJobRunOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobRunId = undefined;

    return k8sJobsService.getJobRunOfNamespace(ctx, accessDetails, jobRunId)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetJobRunError', _code: 102005 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('throws an error in case the jobrun does not exist (getJobRunOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobRunId = 'some-jobdef';

    return k8sJobsService.getJobRunOfNamespace(ctx, accessDetails, jobRunId)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetJobRunError', _code: 102005 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('retrieves job runs (getJobRunsOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();

    return k8sJobsService.getJobRunsOfNamespace(ctx, accessDetails)
      .then((jobruns: jobModel.IJobRun[]) => {
        expect(jobruns).toBeDefined();
        expect(jobruns.length).toEqual(1);
        expect(jobruns[0].metadata.name).toEqual('some-new-job-pjw4v-jobrun-wd7mg');
        done();
      }).catch((e) =>
        done.fail(e)
      );
  });

  it('returns an object with an empty list in case the server responded with a 200 and malformed content (getJobRunsOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('empty');

    return k8sJobsService.getJobRunsOfNamespace(ctx, accessDetails)
      .then((jobruns: jobModel.IJobRun[]) => {
        expect(jobruns).toBeDefined();
        expect(jobruns.length).toEqual(0);
        done();
      }).catch((e) =>
        done.fail(e)
      );
  });

  it('throws an exception in case the backend returns an error (getJobRunsOfNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');

    return k8sJobsService.getJobRunsOfNamespace(ctx, accessDetails)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToGetJobRunsError', _code: 102004 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('deletes a job definition (deleteJobRunInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobRunName = 'foo';

    return k8sJobsService.deleteJobRunInNamespace(ctx, accessDetails, jobRunName)
      .then((opStatus: k8sModel.IKubernetesStatus) => {
        expect(opStatus).toBeDefined();
        expect(opStatus.status).toEqual('Success');
        done();
      }).catch((e) => {
        done.fail(e);
      }
      );
  });

  it('throws an exception in case the given jobrunId is not set properly (deleteJobRunInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobRunName = undefined;

    return k8sJobsService.deleteJobRunInNamespace(ctx, accessDetails, jobRunName)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToDeleteJobRunError', _code: 102001 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });


  it('throws an exception in case the backend returns an error (deleteJobRunInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobRunName = 'something';

    return k8sJobsService.deleteJobRunInNamespace(ctx, accessDetails, jobRunName)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToDeleteJobRunError', _code: 102001 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('creates a job run (createJobRunInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock();
    const jobRunToCreate = {
      metadata: {
        name: 'foo',
      }
    };

    return k8sJobsService.createJobRunInNamespace(ctx, accessDetails, jobRunToCreate)
      .then((jobdef: jobModel.IJobDefinition) => {
        expect(jobdef).toBeDefined();
        expect(jobdef.metadata.name).toEqual('some-new-job-pjw4v-jobrun-wd7mg');
        done();
      }).catch((e) => {
        done.fail(e);
      }
      );
  });

  it('throws an exception in case the given jobdefintion is undefined (createJobRunInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobRunToCreate = undefined;

    return k8sJobsService.createJobRunInNamespace(ctx, accessDetails, jobRunToCreate)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateJobRunError', _code: 102008 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('throws an exception in case the backend returns an error (createJobRunInNamespace)', (done) => {
    const ctx = getRequestContextMock();
    const accessDetails = getAccessDetailsMock('invalid');
    const jobRunToCreate = {
      metadata: {
        name: 'foo',
      }
    };

    return k8sJobsService.createJobRunInNamespace(ctx, accessDetails, jobRunToCreate)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateJobRunError', _code: 102008 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });
});
