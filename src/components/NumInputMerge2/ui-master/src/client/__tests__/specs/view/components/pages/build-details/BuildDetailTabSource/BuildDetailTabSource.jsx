// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import BuildDetailTabSource from 'view/pages/build-details/BuildDetailTabSource/BuildDetailTabSource';
const config = window.armada.config;

describe('BuildDetailTabSource', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<BuildDetailTabSource {...props}>{null}</BuildDetailTabSource>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      allowInputDerivation: true,
      inputValues: { 
        sourceUrl: { val: 'foo'},
      },
      handleChange: (key, value) => { },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-build-detail-page--source coligo-tab');
  });
});
