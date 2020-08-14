// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import JobDefinitionDetailTabEnvironment from 'view/pages/jobdef-details/JobDefinitionDetailTabEnvironment/JobDefinitionDetailTabEnvironment';
const config = window.armada.config;

describe('JobDefinitionDetailTabEnvironment', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<JobDefinitionDetailTabEnvironment {...props}>{null}</JobDefinitionDetailTabEnvironment>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      inputValues: { 
        env: [
          {
            name: { val: 'foo'},
            value: { val: 'bar'},
        }]
      },
      handleChange: (key, value) => { },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-jobdef-detail-page--parameters coligo-tab');
  });
});
