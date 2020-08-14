// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ComponentListSubpage from '../../../../../../../../view/pages/project-details/subpages/component-list/ComponentListSubpage';

describe('ComponentListSubpage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ComponentListSubpage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      errorHandler: (err) => { },
      history: { push: () => {} },
      projectId: 'some-projectId',
      regionId: 'some-region',
    };

    render(props);
    expect(wrapper.props().className).toEqual('component-list-subpage');
  });
});
