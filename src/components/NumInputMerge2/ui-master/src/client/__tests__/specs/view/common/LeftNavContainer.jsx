import React from 'react';
import { LeftNavContainer } from 'view/common/LeftNavContainer';
import { shallow } from 'enzyme';

const config = window.armada.config;

const standardPageRoutes = [
  {
    translationKey: 'clg.nav.getStarted',
    children: [
      {
        path: `${config.proxyRoot}overview`,
        translationKey: 'clg.nav.overview',
      },
    ],
  },
  {
    translationKey: 'clg.nav.viewCreate',
    children: [ {
        path: `${config.proxyRoot}projects`,
        translationKey: 'clg.nav.projects',
      },
    ],
  },
  {
    path: '/functions',
    translationKey: 'clg.nav.backToFunctions',
    isExternalLink: true,
  },
];

describe('LeftNavContainer', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({
      location: { pathname: `${config.proxyRoot}overview` },
    }, overrides || {});
    wrapper = shallow(<LeftNavContainer {...props}>{null}</LeftNavContainer>);
    instance = wrapper.instance();
  };

  it('renders world nav', () => {
    render({ navItems: standardPageRoutes });
    expect(wrapper.childAt(0).name()).toBe('WorldLevelNav');
    expect(wrapper.childAt(1).type()).toBe('div');
    expect(wrapper.childAt(1).props().className).toBe(' has-side-nav');
  });

  it('toggles', () => {
    render({ navItems: standardPageRoutes });
    expect(wrapper.childAt(1).props().className).toBe(' has-side-nav');
    instance.onToggle();
    wrapper.update();
    expect(wrapper.childAt(1).props().className).toBe(' custom-left-nav-collapsed');
  });

  it('returns the currently active page based on the URL', () => {
    render({ navItems: standardPageRoutes, location:  { pathname: `${config.proxyRoot}projects` } });
    expect(wrapper.childAt(1).props().className).toBe(' has-side-nav');
    const pageName = instance.getPage();
    expect(pageName).toBe('projects');
  });
});
