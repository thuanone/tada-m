// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import StatusPage from '../../../../../../../view/pages/health/subpages/StatusPage';

describe('StatusPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><StatusPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      history: { push: () => {} },
    };

    render(props);
    expect(wrapper.html()).toContain('page');
  });
});
