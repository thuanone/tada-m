// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgRegistrySelector from '../../../../../view/components/ClgRegistrySelector/ClgRegistrySelector';

describe('ClgRegistrySelector', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgRegistrySelector {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      addRegistryFn: () => {},
      onError: () => {},
      onGetReloadFn: (fn) => {},
      onSelect: () => {},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-registry-selector');
    expect(wrapper.html()).toContain('loading');
    instance.loadRegistries();
    wrapper.update();
    expect(wrapper.html()).toContain('loading');
  });

  it('render - empty state', () => {
    const props = {
      addRegistryFn: () => {},
      onError: () => {},
      onGetReloadFn: (fn) => {},
      onSelect: () => {},
      project: {
        id: 'some-projectid',
        region: 'us-south',
      }
    };

    render(props);
    instance.onRegistriesLoaded([]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-registry-selector');
    expect(wrapper.html()).toContain('empty-state');
    expect(wrapper.html()).toContain('clg.component.registrySelector.noregistries.title');
    
  });

  it('render - loaded one registry', () => {
    const props = {
      addRegistryFn: () => {},
      onError: () => {},
      onGetReloadFn: (fn) => {},
      onSelect: () => {},
      project: {
        id: 'some-projectid',
        region: 'us-south',
      }
    };

    render(props);
    instance.onRegistriesLoaded([{name: 'foo'}]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-registry-selector');
    expect(wrapper.html()).toContain('loaded');
  });

  it('render - loading failed', () => {
    const props = {
      addRegistryFn: () => {},
      onError: () => {},
      onGetReloadFn: (fn) => {},
      onSelect: () => {},
      project: {
        id: 'some-projectid',
        region: 'us-south',
      }
    };

    render(props);
    instance.onRegistriesLoadingFailed(new Error('foo'));
    wrapper.update();
    expect(wrapper.html()).toContain('clg-registry-selector');
    expect(wrapper.html()).toContain('loaded');
  });
});
