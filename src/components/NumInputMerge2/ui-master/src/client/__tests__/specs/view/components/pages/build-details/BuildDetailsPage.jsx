// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import BuildDetailsPage from '../../../../../../view/pages/build-details/BuildDetailsPage';

describe('BuildDetailsPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><BuildDetailsPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      location: { search: 'some-location-string'},
      history: { push: jest.fn(), },
      match: { 
        params: { 
          buildId: 'some-buildId',
          projectId: 'some-projectId',
          regionId: 'some-regionId',
        }
      },
    };

    render(props);
    expect(wrapper.html()).toContain('page detail-page');
  });
});
