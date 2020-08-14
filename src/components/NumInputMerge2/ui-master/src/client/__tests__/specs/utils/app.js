import React from 'react';
import win from 'utils/window';
import ReactDOM from 'react-dom';
import app from 'utils/app';
import utils from 'api/utils';
import * as i18n from 'utils/i18n';

const env = window.armada;
const config = env.config;

describe('app', () => {
  const Foo = <div></div>;
  const reload = jasmine.createSpy();
  let path = `${config.proxyRoot}clusters/id/access`;
  const always = jasmine.createSpy().and.callFake(cb => cb());

  const mockStorage = {
    key: () => 'foo',
    getItem: () => {},
    removeItem: () => {},
    length: 1,
  };

  beforeEach(() => {
    spyOn(i18n, 'init').and.returnValue({ then: cb => cb() });
    spyOn(ReactDOM, 'render');
    spyOn(document, 'getElementById').and.callFake(id => id);
    always.calls.reset();
    spyOn(utils, 'doGet').and.returnValue({ always });
    spyOn(win, 'get').and.callFake(prop => {
      if (prop === 'location') return { reload };
      if (prop === 'localStorage') return mockStorage;
      return path;
    });
    spyOn(document, 'addEventListener').and.callFake((event, cb) => cb());
    spyOn(win, 'set');
  });

  it('init', () => {
    env.foo = 'true';
    env.bar = 'false';

    // navigate back to top level page
    app.init(Foo);
    expect(win.get).toHaveBeenCalledWith('location.pathname');
    expect(ReactDOM.render).toHaveBeenCalledWith(Foo, 'container');
    expect(win.set).toHaveBeenCalledWith('location', `${config.proxyRoot}clusters`);
    expect(env.foo).toBe(true);
    expect(env.bar).toBe(false);

    path = `${config.proxyRoot}registry/images/namespace/myimages/mytag/detail/issues`;
    app.init(Foo);
    expect(win.set).toHaveBeenCalledWith('location', `${config.proxyRoot}registry/main/images`);

    path = `${config.proxyRoot}catalog/cluster/cluster-id/pools/create`;
    app.init(Foo);
    expect(win.set).toHaveBeenCalledWith('location', `${config.proxyRoot}clusters`);

    // reload page
    path = `${config.proxyRoot}registry/main/namespaces`;
    app.init(Foo);
    expect(win.get).toHaveBeenCalledWith('location');
    expect(reload).toHaveBeenCalled();
  });

  it('cleanLocalStorage', () => {
    spyOn(mockStorage, 'key').and.returnValue('bluemix_ui:v1:foo');
    spyOn(mockStorage, 'getItem').and.returnValue(JSON.stringify({ foo: 'bar', expires: 1 }));
    spyOn(mockStorage, 'removeItem');
    spyOn(window.console, 'error');
    app._.cleanLocalStorage();
    expect(mockStorage.removeItem).toHaveBeenCalledWith('bluemix_ui:v1:foo');
    mockStorage.removeItem.calls.reset();

    mockStorage.getItem.and.returnValue('foo');
    app._.cleanLocalStorage();
    expect(mockStorage.removeItem).not.toHaveBeenCalled();
    expect(window.console.error).toHaveBeenCalled();

    mockStorage.getItem.and.returnValue(JSON.stringify({ foo: 'bar', expires: new Date().getTime() + 5000 }));
    app._.cleanLocalStorage();
    expect(mockStorage.removeItem).not.toHaveBeenCalled();

    mockStorage.key.and.returnValue('foo');
    app._.cleanLocalStorage();
    expect(mockStorage.removeItem).not.toHaveBeenCalled();
  });
});
