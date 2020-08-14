// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import BuildDetailTabStrategy from 'view/pages/build-details/BuildDetailTabStrategy/BuildDetailTabStrategy';
const config = window.armada.config;

describe('BuildDetailTabStrategy', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<BuildDetailTabStrategy {...props}>{null}</BuildDetailTabStrategy>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      allowInputDerivation: true,
      inputValues: { 
        strategyName: { val: 'foo' },
      },
      handleChange: (key, value) => { },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-build-detail-page--strategy coligo-tab');
  });
});
