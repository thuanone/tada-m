// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';

describe('request retry lib', () => {
  let requestRetry;
  let request;

  beforeEach(() => {
    request = jasmine.createSpy();
    requestRetry = proxyquire('../../../ts/utils/request-utils', {
      '@console/console-platform-log4js-utils': loggerUtil,
      request,
    });
  });

  it('sends request', () => {
    // spyOn(global, 'setTimeout').and.callFake(() => cb());
    const callback = jasmine.createSpy();
    requestRetry({}, callback);
    expect(request).toHaveBeenCalledWith({}, jasmine.any(Function));
    expect(request).toHaveBeenCalledTimes(1);
    let cb = request.calls.argsFor(0)[1];
    cb('error', { statusCode: 502 }, 'body');
    expect(request).toHaveBeenCalledTimes(1);
    cb = request.calls.argsFor(0)[1];
    cb('error', { statusCode: 500 }, 'body');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
