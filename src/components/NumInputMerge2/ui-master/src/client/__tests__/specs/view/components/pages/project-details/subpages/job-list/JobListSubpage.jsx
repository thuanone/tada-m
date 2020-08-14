// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import JobListSubpage from '../../../../../../../../view/pages/project-details/subpages/job-list/JobListSubpage';

describe('JobListSubpage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<JobListSubpage {...props} />);
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
    expect(wrapper.props().className).toEqual('job-list-subpage');
  });
});
