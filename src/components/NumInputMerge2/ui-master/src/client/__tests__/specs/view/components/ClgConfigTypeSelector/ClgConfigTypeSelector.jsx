// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgConfigTypeSelector from '../../../../../view/components/ClgConfigTypeSelector/ClgConfigTypeSelector';
import { IConfigTypes } from '../../../../../view/common/types';

describe('ClgConfigTypeSelector', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgConfigTypeSelector {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    let props = {
      onChange: () => {},
      selectedType: undefined,
    };

    render(props);
    expect(wrapper.html()).toContain('clg-config-type-selector');

    props = {
      onChange: () => {},
      selectedType: IConfigTypes.CONFMAP,
    };

    render(props);
    expect(wrapper.html()).toContain('clg-config-type-selector');
  });
});
