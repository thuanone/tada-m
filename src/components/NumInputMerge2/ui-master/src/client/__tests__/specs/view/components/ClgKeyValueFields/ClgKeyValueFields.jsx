// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgKeyValueFields from '../../../../../view/components/ClgKeyValueFields/ClgKeyValueFields';

describe('ClgKeyValueFields', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgKeyValueFields {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      handleChange: (event) => {},
    };

    render(props);
    expect(wrapper.hasClass('keyvalues-fields')).toEqual(true);
    expect(wrapper.hasClass('coligo-form')).toEqual(true);
  });

  it('simple render - check whether empty state is rendered and can be changed be adding/removing keyvalue pairs', () => {
    const props = {
      handleChange: (event) => {},
      emptyText: 'foo-bar',
    };

    render(props);

    // check for the empty state text
    expect(wrapper.html()).toContain(props.emptyText);

    // add a keyvalue
    instance.addKeyValue();

    // now the empty state text should be gone
    expect(wrapper.html()).not.toContain(props.emptyText);

    // delete a keyvalue
    instance.deleteKeyValue(0);

    // check for the empty state text
    expect(wrapper.html()).toContain(props.emptyText);
  });
});
