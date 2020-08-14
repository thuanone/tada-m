// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import JobDefinitionDetailTabRuntime from 'view/pages/jobdef-details/JobDefinitionDetailTabRuntime/JobDefinitionDetailTabRuntime';
const config = window.armada.config;

describe('JobDefinitionDetailTabRuntime', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<JobDefinitionDetailTabRuntime {...props}>{null}</JobDefinitionDetailTabRuntime>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      inputValues: { 
        cpus: { 
          val: 2
        },
        memory: { val: 1024 },
      },
      handleChange: (key, value) => { },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-jobdef-detail-page--limits coligo-tab');
  });
});
