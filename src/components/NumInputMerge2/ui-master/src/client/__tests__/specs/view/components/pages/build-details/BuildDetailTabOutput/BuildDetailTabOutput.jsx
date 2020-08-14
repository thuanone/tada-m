// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import BuildDetailTabOutput from 'view/pages/build-details/BuildDetailTabOutput/BuildDetailTabOutput';
const config = window.armada.config;

describe('BuildDetailTabOutput', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<BuildDetailTabOutput {...props}>{null}</BuildDetailTabOutput>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      allowInputDerivation: true,
      inputValues: { 
        outputImage: {
          val: 'foo'
        }, 
      },
      handleChange: (key, value) => { },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-build-detail-page--output coligo-tab');
  });
});
