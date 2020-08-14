// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import JobRunDetailsPage from '../../../../../../view/pages/jobrun-details/JobRunDetailsPage';

describe('JobRunDetailsPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><JobRunDetailsPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      location: { search: 'some-location-string'},
      history: { push: jest.fn(), },
      match: { 
        params: { 
          jobRunId: 'some-jobrunId',
          projectId: 'some-projectId',
          regionId: 'some-regionId',
        }
      },
    };

    render(props);
    expect(wrapper.html()).toContain('page detail-page');
  });
});
