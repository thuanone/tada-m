// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ConfigListSubpage from '../../../../../../../../view/pages/project-details/subpages/config-list/ConfigListSubpage';

describe('ConfigListSubpage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ConfigListSubpage {...props} />);
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
    expect(wrapper.props().className).toEqual('config-list-subpage');
  });
});
