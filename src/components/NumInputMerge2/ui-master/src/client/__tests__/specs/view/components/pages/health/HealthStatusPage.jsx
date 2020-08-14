// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import HealthStatusPage from '../../../../../../view/pages/health/HealthStatusPage';

describe('HealthStatusPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><HealthStatusPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      location: { search: 'some-location-string'},
      history: { push: jest.fn(), },
      match: { 
        params: { 
        }
      },
    };

    render(props);
    expect(wrapper.html()).toContain('page detail-page health-page');
  });
});
