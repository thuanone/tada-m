// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import AvailabilityStatusPage from '../../../../../view/pages/AvailabilityStatusPage';

describe('AvailabilityStatusPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<Router><AvailabilityStatusPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      location: { search: 'some-location-string'},
      history: { push: jest.fn(), },
      match: {
        params: {}
      },
    };

    render(props);
    expect(wrapper.html()).toContain('header aria-label="clg.page.availability-status.title"');
  });
});
