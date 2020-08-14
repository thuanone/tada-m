// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import expressRequest from '../../mocks/lib/express-request';
import expressResponse from '../../mocks/lib/express-response';

// mocks
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';
import * as projectMiddlewareMock from '../../mocks/middleware/project-middleware';
import * as monitoringUtilsMock from '../../mocks/utils/monitoring-utils';

import * as commonModel from '../../../../common/model/common-model';

describe('projects route', () => {
  let projects;
  let request;

  beforeEach(() => {
    request = jasmine.createSpy();
    projects = proxyquire('../../../ts/endpoints/project-endpoints', {
      '../middleware/project-middleware': projectMiddlewareMock,
      '../utils/logger-utils': loggerUtilMock,
      '../utils/middleware-utils': proxyquire('../../../ts/utils/middleware-utils', {
        './monitoring-utils': monitoringUtilsMock,
      }),
    });
  });

  it('has expected exports', () => {
    expect(Object.keys(projects)).toEqual(['createProject', 'getAllProjects', 'getProject', 'getProjectStatus', 'getProjectConsumption', 'listProjects', 'listResourceGroups', 'listRegions', 'deleteProject']);
  });

  it('list projects', (done) => {
    const regionId = 'all';
    const req = expressRequest({ clgCtx: { startTime: Date.now()}, clgRoute: 'foo', params: { regionId } });
    const res = expressResponse();

    // setup spys
    spyOn(projectMiddlewareMock, 'listProjects').and.callFake((_, __) => (Promise.resolve([{ id: 'foo', kind: commonModel.UIEntityKinds.PROJECT, region: 'au-syd', crn: 'some-crn', name: 'bar' }])));
    spyOn(res, 'send');

    // call the endpoint function
    projects.listProjects(req, res);

    // evaluate the result
    expect(projectMiddlewareMock.listProjects).toHaveBeenCalledWith(jasmine.any(Object), regionId);
    setTimeout(() => {
      expect(res.send).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'OK' }));
      done();
    });
  });

  it('list projects fails due to wrong region', (done) => {
    const regionId = 'something-stupid';
    const req = expressRequest({ clgCtx: { startTime: Date.now()}, clgRoute: 'foo', params: { regionId } });
    const res = expressResponse();

    // setup spys
    spyOn(projectMiddlewareMock, 'listProjects').and.callFake((_, __) => (Promise.reject(new Error('some-error'))));
    spyOn(res, 'send');

    // call the endpoint function
    projects.listProjects(req, res);

    // evaluate the result
    expect(projectMiddlewareMock.listProjects).toHaveBeenCalledWith(jasmine.any(Object), regionId);
    setTimeout(() => {
      expect(res.send).toHaveBeenCalledWith(jasmine.any(Error));
      done();
    });
  });

});
