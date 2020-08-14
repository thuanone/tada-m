// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgComboBox from '../../../../../view/components/ClgComboBox/ClgComboBox';

describe('ClgComboBox', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgComboBox {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      inputId: 'foobar',
      items: [{id: 'foo', text: 'bar'}],
      nlsKey: 'some.nls.key',
      onChange: () => {},
    };

    render(props);
    expect(wrapper.html()).toContain('clg--combo-box');
  });

  it('render - loading state', () => {
    const props = {
      inputId: 'foobar',
      items: [],
      isLoading: true,
      nlsKey: 'some.nls.key',
      onChange: () => {},
    };

    render(props);
    expect(wrapper.html()).toContain('clg--combo-box');
    expect(wrapper.html()).toContain('bx--skeleton bx--dropdown-v2'); // still loading
  });
});
