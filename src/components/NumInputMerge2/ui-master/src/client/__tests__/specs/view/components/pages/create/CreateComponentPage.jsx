// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import CreateComponentPage from '../../../../../../view/pages/create/CreateComponentPage';

describe('CreateComponentPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><CreateComponentPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render (application subpage)', () => {
    const props = {
      location: { search: 'some-location-string'},
      history: { push: jest.fn(), },
      match: { 
        params: { 
          projectId: 'some-projectId',
          regionId: 'some-regionId',
        }
      },
    };

    render(props);
    expect(wrapper.html()).toContain('page create-pages');
    expect(wrapper.html()).toContain('coligo-create--content');
    expect(wrapper.html()).not.toContain('no-ordersummary');
  });

  it('simple render (jobdef subpage)', () => {
    const props = {
      type: 'jobdefinition',
    };

    render(props);
    expect(wrapper.html()).toContain('page create-pages');
    expect(wrapper.html()).toContain('coligo-create--content');
    expect(wrapper.html()).toContain('no-ordersummary');
  });
});
