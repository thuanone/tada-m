import React from 'react';
import { shallow } from 'enzyme';

import Page from '../../../../view/common/Page';

describe('Page', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<Page {...props}>{null}</Page>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    render({ });
    expect(wrapper.props().className).toBe('coligo-page ibm-cloud-app');
  });

});
