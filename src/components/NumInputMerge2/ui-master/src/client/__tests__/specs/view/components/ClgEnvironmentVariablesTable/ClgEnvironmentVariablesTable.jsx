// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgEnvironmentVariablesTable from '../../../../../view/components/ClgEnvironmentVariablesTable/ClgEnvironmentVariablesTable';

describe('ClgEnvironmentVariablesTable', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgEnvironmentVariablesTable {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      allowInputDerivation: false,
      handleChange: (event) => {},
      projectId: 'blub',
      regionId: 'us-south',
    };

    render(props);
    expect(wrapper.hasClass('environment-variables')).toEqual(true);
    expect(wrapper.hasClass('coligo-form')).toEqual(true);
  });

  it('simple render - check whether empty state is rendered and can be changed be adding/removing variables', () => {
    const props = {
      allowInputDerivation: false,
      handleChange: (event) => {},
      emptyText: 'foo-bar',
      projectId: 'blub',
      regionId: 'us-south',
    };

    render(props);

    // check for the empty state text
    expect(wrapper.html()).toContain(props.emptyText);

    // add a varibale
    instance.addVariable();

    // now the empty state text should be gone
    expect(wrapper.html()).not.toContain(props.emptyText);

    // delete a varibale
    instance.deleteVariable(0);

    // check for the empty state text
    expect(wrapper.html()).toContain(props.emptyText);
  });
});
