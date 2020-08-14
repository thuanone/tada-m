import React from 'react';
import init from 'view/app';
import app from 'utils/app';
import win from 'utils/window';
import { shallow } from 'enzyme';

const config = window.armada.config;

describe('App', () => {
  it('inits', () => {
    spyOn(app, 'init');
    spyOn(win, 'get').and.returnValue(`${config.proxyRoot}clusters/cluster-id/overview`);
    init();
    expect(app.init).toHaveBeenCalled();
    const wrapper = shallow(app.init.calls.argsFor(0)[0]);
    expect(wrapper.name()).toBe('BrowserRouter');
    expect(wrapper.childAt(1).name()).toBe('ContextProvider');
    expect(wrapper.childAt(1).childAt(1).name()).toBe('ClgOfferingAnnouncement');
    expect(wrapper.childAt(1).childAt(2).name()).toBe('withRouter(LeftNavContainer)');
    expect(wrapper.childAt(1).childAt(2).childAt(0).name()).toBe('Page');
    expect(wrapper.find('Page').at(0).props()).toEqual(jasmine.objectContaining({
      messages: true, errors: true, confirmations: true, infos: true,
    }));
    const routes = wrapper.find('Route');
    expect(routes.length).toBe(24);
    routes.forEach(route => {
      shallow(React.createElement(route.props().component, { match: { params: {} } }));
    });
  });
});
