// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import JobDefinitionDetailTabCode from 'view/pages/jobdef-details/JobDefinitionDetailTabCode/JobDefinitionDetailTabCode';
const config = window.armada.config;

describe('JobDefinitionDetailTabCode', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<JobDefinitionDetailTabCode {...props}>{null}</JobDefinitionDetailTabCode>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      allowInputDerivation: false,
      inputValues: {
        image: {
          val: 'foo'
        },
        command: {
          val: 'bar'
        },
        args: {
          val: 'xyz'
        }
      },
      handleChange: (key, value) => { },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-jobdef-detail-page--code coligo-tab');
  });
});
