import cache from 'utils/cache';
describe('cache', () => {
  const homeMocks = [ // api/core/v1/region/all/projects
    { url: /\/.+\/api\/core\/v1\/region\/all\/projects/, responseText: [{ name: 'project1' }] },
  ];
  const serverError = { url: /\/.+\/api\/clusters\/foo.*/, status: 500 };

  afterEach(() => {
    cache.reset();
    $.mockjax.clear();
  });

  it('put and get', () => {
    expect(cache.get('foo')).toBeUndefined();
    cache.put('foo', 1);
    expect(cache.get('foo')).toBe(1);
  });

  it('add and remove listener', () => {
    const callback = jasmine.createSpy();
    const remove = cache.listen('foo', callback);
    cache.put('foo', 1);
    expect(callback).toHaveBeenCalledWith(1);
    callback.calls.reset();
    remove();
    cache.put('foo', 1);
    expect(callback).not.toHaveBeenCalled();
  });

  it('remove listener when none exist', () => {
    const remove = cache.listen('foo', () => {});
    cache.reset();
    remove();
  });

  it('remove listener that does not exist', () => {
    const remove = cache.listen('foo', () => {});
    remove();
    remove();
  });

  it('ignores removed callbacks', () => {
    let remove2 = null;
    const callback1 = () => remove2();
    const callback2 = jasmine.createSpy();
    cache.listen('foo', callback1);
    remove2 = cache.listen('foo', callback2);
    cache.put('foo', 1);
    expect(callback2).not.toHaveBeenCalled();
  });

  it('ignores removed errbacks', done => {
    let remove2 = null;
    const errback1 = () => remove2();
    const errback2 = jasmine.createSpy();
    cache.listen('details', null, errback1);
    remove2 = cache.listen('details', null, errback2);
    $.mockjax(serverError);
    cache.update('foo', 'details');
    setTimeout(() => {
      expect(errback2).not.toHaveBeenCalled();
      done();
    }, 10);
  });

  it('list projects', done => {
    $.mockjax(homeMocks);
    const callback = jasmine.createSpy();
    cache.listen('coligo-projects', callback);
    cache.update(null, 'coligo-projects');
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(cache.get('coligo-projects'));
      done();
    }, 10);
  });
});
