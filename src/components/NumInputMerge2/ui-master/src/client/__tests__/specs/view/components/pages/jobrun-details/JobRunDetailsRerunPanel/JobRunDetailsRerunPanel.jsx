// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import JobRunDetailsRerunPanel from '../../../../../../../view/pages/jobrun-details/JobRunDetiailsRerunPanel/JobRunDetailsRerunPanel';

describe('JobRunDetailsRerunPanel', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><JobRunDetailsRerunPanel {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      jobRun: {
        name: 'jobdrun',
        spec: {
            cpus: 1,
            memory: 128,
        }
      },
      history: { push: jest.fn(), },
      jobDefinitionName: 'jobdef-name',
      regionId: 'region',
      rerun: false,
      projectId: 'project',
      location: { search: 'some-location-string'},
    };

    render(props);
    expect(wrapper.html()).toContain('jobs-sp-arrayspec');
  });
});
