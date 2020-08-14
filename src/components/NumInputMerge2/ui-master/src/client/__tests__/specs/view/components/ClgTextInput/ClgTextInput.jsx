// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgTextInput from '../../../../../view/components/ClgTextInput/ClgTextInput';

describe('ClgTextInput', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgTextInput {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      hasTooltip: false,
      inputId: 'some-id',
      nlsKey: 'some.nls.key',
      onChange: (event)=> { },
      textField: {
        val: 'some-value'
      },
      validationRules: { },
    };

    render(props);
    expect(wrapper.hasClass('clg--text-input')).toEqual(true);
    expect(wrapper.childAt(0).name()).toBe('ForwardRef(TextInput)');
  });

  it('simple render with tooltip', () => {
    const props = {
      hasTooltip: true,
      inputId: 'some-id',
      nlsKey: 'some.nls.key',
      onChange: (event)=> { },
      textField: {
        val: 'some-value'
      },
      validationRules: { },
    };

    render(props);
    expect(wrapper.hasClass('clg--text-input')).toEqual(true);
    expect(wrapper.childAt(0).name()).toBe('ForwardRef(Tooltip)');
    expect(wrapper.childAt(1).name()).toBe('ForwardRef(TextInput)');
  });

  it('simple render as password', () => {
    const props = {
      hasTooltip: false,
      inputId: 'some-id',
      isSecret: true,
      nlsKey: 'some.nls.key',
      onChange: (event)=> { },
      textField: {
        val: 'some-value'
      },
      validationRules: { },
    };

    render(props);
    expect(wrapper.hasClass('clg--text-input')).toEqual(true);
    expect(wrapper.childAt(0).name()).toBe('ForwardRef(ControlledPasswordInput)');
  });
});
