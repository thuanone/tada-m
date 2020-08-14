import utils from 'api/utils';
import context from 'utils/context';
import win from 'utils/window';

describe('api utils', () => {
  let xhr1;
  let xhr2;
  const createXhr = () => {
    const xhr = {
      abort: jasmine.createSpy(),
    };
    xhr.done = jasmine.createSpy().and.returnValue(xhr);
    xhr.fail = jasmine.createSpy().and.returnValue(xhr);
    xhr.always = jasmine.createSpy().and.returnValue(xhr);
    return xhr;
  };

  const createMockAjax = (done, fail, always) => {
    const mockAjax = {
      done: cb => {
        if (done && cb) cb(done);
        return mockAjax;
      },
      fail: cb => {
        if (fail && cb) cb(fail);
        return mockAjax;
      },
      always: cb => {
        if (always && cb) cb(always);
        return mockAjax;
      },
      abort: () => {},
    };
    return mockAjax;
  };

  beforeEach(() => {
    spyOn(context, 'getAccountData').and.callFake(cb => cb({ account: { accountGuid: 'account-1', softlayerAccountId: '1234' } }));
    spyOn(win, 'set');
    spyOn(win, 'timeout').and.returnValue(() => {});
    xhr1 = createXhr();
    xhr2 = createXhr();
  });

  it('doGet', () => {
    spyOn($, 'ajax').and.returnValue(createMockAjax({}));
    utils.doGet({ url: '/foo' });
    expect($.ajax).toHaveBeenCalledWith({
      url: '/foo',
      method: 'GET',
      dataType: 'json',
      contentType: 'application/json',
      headers: {
        'x-auth-region': context.getRegion(),
        'x-auth-metro': context.getMetro(),
        'x-auth-resource-group': context.getResourceGroup(),
        'x-request-origin': window.location.href,
        accept: 'application/json',
        Account: 'account-1',
        'x-auth-account-id': 'account-1',
        'x-auth-ims-account-id': '1234',
      },
    });
    $.ajax.calls.reset();

    // request was cached
    expect(win.timeout).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Number));
    utils.doGet({ url: '/foo' });
    expect($.ajax).not.toHaveBeenCalled();
    win.timeout.calls.argsFor(0)[0]();
  });

  it('returns fake ajax object when account data not known', done => {
    // Use a timeout to simulate async fetching of account data
    context.getAccountData.and.callFake(cb => setTimeout(cb, 1));
    spyOn($, 'ajax').and.returnValue(xhr1);
    let ajaxObject = utils.doGet({ url: '/foo' });
    expect(ajaxObject.isFake).toBe(true);
    ajaxObject.done().fail().always();
    ajaxObject.done('foo').always('foo');
    expect(xhr1.done).not.toHaveBeenCalled();
    expect(xhr1.fail).not.toHaveBeenCalled();
    expect(xhr1.always).not.toHaveBeenCalled();
    expect(xhr1.abort).not.toHaveBeenCalled();
    setTimeout(() => {
      ajaxObject.done().fail().always().abort();
      expect(xhr1.done).toHaveBeenCalled();
      expect(xhr1.fail).toHaveBeenCalled();
      expect(xhr1.always).toHaveBeenCalled();
      expect(xhr1.abort).toHaveBeenCalled();
      $.ajax.calls.reset();
      ajaxObject = utils.doGet({ url: '/foo' });
      ajaxObject.abort();
      setTimeout(() => {
        expect($.ajax).not.toHaveBeenCalled();
        done();
      }, 10);
    }, 10);
  });

  it('all - success', () => {
    const callback = jasmine.createSpy();
    const errback = jasmine.createSpy();
    const always = jasmine.createSpy();
    utils.all([xhr1, xhr2], callback, errback, always);
    expect(xhr1.done).toHaveBeenCalled();
    expect(xhr2.done).toHaveBeenCalled();
    expect(xhr1.fail).toHaveBeenCalled();
    expect(xhr2.fail).toHaveBeenCalled();
    xhr1.done.calls.argsFor(0)[0]();
    expect(callback).not.toHaveBeenCalled();
    expect(errback).not.toHaveBeenCalled();
    expect(always).not.toHaveBeenCalled();
    xhr2.done.calls.argsFor(0)[0]();
    expect(callback).toHaveBeenCalled();
    expect(errback).not.toHaveBeenCalled();
    expect(always).toHaveBeenCalled();
    expect(xhr1.abort).not.toHaveBeenCalled();
    expect(xhr2.abort).not.toHaveBeenCalled();
  });

  it('all - fail', () => {
    const callback = jasmine.createSpy();
    const errback = jasmine.createSpy();
    const always = jasmine.createSpy();
    utils.all([xhr1, xhr2], callback, errback, always);
    // First fail triggers the errback, second one is ignored
    xhr1.fail.calls.argsFor(0)[0]();
    xhr2.fail.calls.argsFor(0)[0]();
    expect(callback).not.toHaveBeenCalled();
    expect(errback).toHaveBeenCalled();
    expect(always).toHaveBeenCalled();
    expect(xhr1.abort).toHaveBeenCalled();
    expect(xhr2.abort).toHaveBeenCalled();
  });

  it('all - success with no always', () => {
    const callback = jasmine.createSpy();
    const errback = jasmine.createSpy();
    utils.all([xhr1, xhr2], callback, errback);
    xhr1.done.calls.argsFor(0)[0]();
    xhr2.done.calls.argsFor(0)[0]();
  });

  it('all - fail with no always', () => {
    const callback = jasmine.createSpy();
    const errback = jasmine.createSpy();
    utils.all([xhr1, xhr2], callback, errback);
    xhr1.fail.calls.argsFor(0)[0]();
  });

  it('logs the user out based on response data', () => {
    spyOn($, 'ajax').and.returnValue(xhr1);
    const ajaxObject = utils.doGet({ url: '/foo' });
    expect(ajaxObject.fail).toHaveBeenCalledTimes(2);
    ajaxObject.fail.calls.argsFor(0)[0]({ responseJSON: { requestId: '123', errorCode: 'ABC', description: 'error', code: 'iam' } });
    expect(win.set).toHaveBeenCalledWith('location', '/logout');
  });

  it('doGetAndStore', () => {
    const data = {};
    spyOn(utils._, 'getLocal').and.returnValue(data);
    spyOn(utils._, 'createResponse');
    spyOn(utils._, 'createAjaxObject').and.returnValue(createMockAjax());
    const options = {};
    utils.doGetAndStore('key', 6, null, options);
    expect(utils._.createResponse).toHaveBeenCalledWith(data);
    expect(utils._.createAjaxObject).not.toHaveBeenCalled();
    utils._.createResponse.calls.reset();
    utils._.getLocal.and.returnValue(null);
    utils.doGetAndStore('key', 6, null, options);
    expect(utils._.createResponse).not.toHaveBeenCalled();
    expect(utils._.createAjaxObject).toHaveBeenCalledWith('GET', options);
  });

  it('getLocal', () => {
    spyOn(window.storage, 'getItem');
    utils._.getLocal('foo');
    expect(window.storage.getItem).toHaveBeenCalledWith('foo', { local: true });
    window.storage.getItem.and.throwError();
    expect(utils._.getLocal('foo')).toBeNull();

    // cache bust
    const storage = { getItem: jasmine.createSpy().and.returnValue(JSON.stringify({ time: Date.now() - 5000 })) };
    spyOn(window.storage, 'getStorage').and.returnValue(storage);
    spyOn(window.storage, 'removeItem');
    expect(utils._.getLocal('key', Date.now() - 2000)).toBeNull();
    expect(storage.getItem).toHaveBeenCalledWith('full-key');
    expect(window.storage.removeItem).toHaveBeenCalledWith('key');
    window.storage.getItem.calls.reset();
    window.storage.removeItem.calls.reset();
    utils._.getLocal('key', Date.now() - 8000);
    expect(window.storage.getItem).toHaveBeenCalledWith('key', { local: true });
    expect(window.storage.removeItem).not.toHaveBeenCalled();
  });

  it('setLocal', () => {
    spyOn(window.storage, 'setItem');
    utils._.setLocal('foo', {}, 6);
    expect(window.storage.setItem).toHaveBeenCalledWith('foo', {}, { local: true, expires: jasmine.any(Number) });
    window.storage.setItem.and.throwError();
    utils._.setLocal('foo', {}, 6);
  });

  it('createResponse', () => {
    const data = {};
    const callback = jasmine.createSpy();
    const ajaxObject = utils._.createResponse(data);
    expect(ajaxObject.done(callback)).toBe(ajaxObject);
    expect(callback.calls.count()).toBe(1);
    expect(ajaxObject.fail()).toBe(ajaxObject);
    expect(ajaxObject.always(callback)).toBe(ajaxObject);
    expect(callback.calls.count()).toBe(2);
    ajaxObject.done();
    ajaxObject.always();
    ajaxObject.abort();
    expect(callback.calls.count()).toBe(2);
  });
});
