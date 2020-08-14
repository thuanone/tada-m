// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgResourceGroupSelector from '../../../../../view/components/ClgResourceGroupSelector/ClgResourceGroupSelector';

describe('ClgResourceGroupSelector', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgResourceGroupSelector {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-resource-group-selector');
  });

  it('render - empty state', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    instance.onResourceGroupsLoaded([]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-resource-group-selector');
    expect(wrapper.html()).toContain('clg.component.resourceGroupSelector.info.nogroups.title');
  });

  it('render - loaded one resource group', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    instance.onResourceGroupsLoaded([{name: 'my-resource-group'}]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-resource-group-selector');
    expect(wrapper.html()).toContain('my-resource-group');
  });

  it('render - loading failed', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    instance.onResourceGroupsLoadingFailed(new Error('foo'));
    wrapper.update();
    expect(wrapper.html()).toContain('clg-resource-group-selector');
    expect(wrapper.html()).toContain('bx--label bx--label--disabled'); // in case of an error the dropdown will be disabled
  });
});
