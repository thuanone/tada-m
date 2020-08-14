// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import expressRequest from '../../mocks/lib/express-request';

describe('launchdarkly' , () => {
  let launchdarkly;

  const client = {
    // tslint:disable-next-line:no-empty
    variation: () => {},
  };
  const clientlib = {
    init: () => client,
  };

  beforeEach(() => {
    launchdarkly = proxyquire('../../../ts/services/launchdarkly-service', {
      '@console/console-platform-log4js-utils': loggerUtil,
      'launchdarkly-node-server-sdk': clientlib,
    });
    launchdarkly.init();
  });

  it('gets flags', () => {
    spyOn(client, 'variation');
    const callback = jasmine.createSpy();

    // Anonymous user, not logged in
    const req = expressRequest();
    launchdarkly.getFlag(req, 'myflag', callback);
    expect(client.variation).toHaveBeenCalledWith('myflag', { key: 'unknown', anonymous: true }, false, jasmine.any(Function));
    client.variation['calls'].reset();

    // Logged in user
    req.setUser({
      bss_account: 'bssAccountId',
      displayName: 'Foo Bar',
      emails: [{ value: 'foo@bar.com' }],
      iam_id: 'iamId',
      ims_account: 'imsAccountId',
      name: { givenName: 'Foo', familyName: 'Bar' },
    });
    launchdarkly.getFlag(req, 'myflag', callback);
    expect(client.variation).toHaveBeenCalledWith('myflag', {
      custom: {
        bssAccountID: 'bssAccountId',
        imsAccountID: 'imsAccountId',
      },
      email: 'foo@bar.com',
      key: 'iamId',
      // name: 'Foo Bar',
      // firstName: 'Foo',
      // lastName: 'Bar',
      privateAttributeNames: ['email'],
    }, false, jasmine.any(Function));

    const cb = client.variation['calls'].argsFor(0)[3];
    cb('error');
    expect(callback).toHaveBeenCalledWith(undefined);
    callback.calls.reset();
    cb(null, true);
    expect(callback).toHaveBeenCalledWith(true);
    callback.calls.reset();
    client.variation['calls'].reset();

    // Multiple flags
    client.variation['and'].callFake((f, u, d, cbk) => cbk(null, 'flagValue'));
    launchdarkly.getFlag(req, ['flag1', 'flag2'], callback);
    expect(client.variation).toHaveBeenCalledWith('flag1', jasmine.any(Object), false, jasmine.any(Function));
    expect(client.variation).toHaveBeenCalledWith('flag2', jasmine.any(Object), false, jasmine.any(Function));
    client.variation['calls'].reset();
    expect(callback.calls.count()).toBe(1);
    expect(callback).toHaveBeenCalledWith({ flag1: 'flagValue', flag2: 'flagValue' });
    callback.calls.reset();

    client.variation['and'].callFake((f, u, d, cbk) => cbk('error'));
    launchdarkly.getFlag(req, ['flag1', 'flag2'], callback);
    expect(client.variation).toHaveBeenCalledWith('flag1', jasmine.any(Object), false, jasmine.any(Function));
    expect(client.variation).toHaveBeenCalledWith('flag2', jasmine.any(Object), false, jasmine.any(Function));
    client.variation['calls'].reset();
    expect(callback.calls.count()).toBe(1);
    expect(callback).toHaveBeenCalledWith({ flag1: undefined, flag2: undefined });
    callback.calls.reset();
  });

  it('gets flags sync', done => {
    spyOn(client, 'variation');
    const req = expressRequest();
    const flag = launchdarkly.getFlagSync(req, 'myflag');
    expect(client.variation).toHaveBeenCalledWith('myflag', { key: 'unknown', anonymous: true }, false, jasmine.any(Function));
    client.variation['calls'].argsFor(0)[3](null, true);
    expect(flag).toEqual(jasmine.any(Promise));
    const cb = jasmine.createSpy();
    flag.then(cb);
    setTimeout(() => {
      expect(cb).toHaveBeenCalledWith(true);
      done();
    }, 10);
  });
});
