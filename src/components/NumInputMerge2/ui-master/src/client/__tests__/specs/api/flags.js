import api from 'api/flags';

describe('flags api', () => {
  let callback;
  let errback;
  let always;
  const mock200 = { url: '*', status: 200 };
  const mock401 = { url: '*', status: 401 };

  beforeEach(() => {
    callback = jasmine.createSpy();
    errback = jasmine.createSpy();
    always = jasmine.createSpy();
  });

  afterEach(() => {
    $.mockjax.clear();
  });

  it('get flag', done => {
    $.mockjax(mock200);
    api.getFlag('foo', callback, errback, always);
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      expect(errback).not.toHaveBeenCalled();
      expect(always).toHaveBeenCalled();
      done();
    }, 10);
  });

  it('error getting flag', done => {
    $.mockjax(mock401);
    api.getFlag('foo', callback, errback, always);
    setTimeout(() => {
      expect(callback).not.toHaveBeenCalled();
      expect(errback).toHaveBeenCalled();
      expect(always).toHaveBeenCalled();
      done();
    }, 10);
  });
});
