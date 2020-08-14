// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import expressRequest from '../../mocks/lib/express-request';
import expressResponse from '../../mocks/lib/express-response';
import * as launchdarkly from '../../mocks/lib/launchdarkly';

describe('flags route', () => {
  let flags;
  let request;

  beforeEach(() => {
    request = jasmine.createSpy();
    flags = proxyquire('../../../ts/endpoints/flags-endpoints', {
      '../services/launchdarkly-service': launchdarkly
    });
  });

  it('has expected exports', () => {
    expect(Object.keys(flags)).toEqual(['getFlag']);
  });

  it('get flag', () => {
    const req = expressRequest({ query: { flag: 'myflag' } });
    const res = expressResponse();
    spyOn(launchdarkly, 'getFlag').and.callFake((_, __, cb) => cb('value'));
    spyOn(res, 'json');
    flags.getFlag(req, res);
    expect(launchdarkly.getFlag).toHaveBeenCalledWith(req, 'myflag', jasmine.any(Function));
    expect(res.json).toHaveBeenCalledWith({ value: 'value' });
  });
});
