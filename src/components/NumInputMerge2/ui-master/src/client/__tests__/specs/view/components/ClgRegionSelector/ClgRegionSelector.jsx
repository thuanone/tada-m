// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgRegionSelector from '../../../../../view/components/ClgRegionSelector/ClgRegionSelector';

describe('ClgRegionSelector', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgRegionSelector {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-region-selector');
  });

  it('render - empty state', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    instance.onRegionsLoaded([]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-region-selector');
    expect(wrapper.html()).toContain('bx--skeleton bx--dropdown-v2'); // still loading
  });

  it('render - loaded one region', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    instance.onRegionsLoaded([{id: 'us-south'}]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-region-selector');
    expect(wrapper.html()).toContain('clg.common.region.us-south');
  });

  it('render - loading failed', () => {
    const props = {
      onError: () => {},
      onSelect: () => {},
    };

    render(props);
    instance.onRegionsLoadingFailed(new Error('foo'));
    wrapper.update();
    expect(wrapper.html()).toContain('clg-region-selector');
    expect(wrapper.html()).toContain('bx--label bx--label--disabled'); // in case of an error the dropdown will be disabled
  });
});
