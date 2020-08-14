// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import CreateConfigPage from '../../../../../../view/pages/create/CreateConfigPage';
import { IConfigTypes } from '../../../../../../view/common/types';

describe('CreateConfigPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><CreateConfigPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render (secret subpage)', () => {
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
    expect(wrapper.html()).toContain('no-ordersummary');
    
  });

  it('simple render (confmap subpage)', () => {
    const props = {
      type: IConfigTypes.CONFMAP,
    };

    render(props);
    expect(wrapper.html()).toContain('page create-pages');
    expect(wrapper.html()).toContain('coligo-create--content');
    expect(wrapper.html()).toContain('no-ordersummary');
  });
});
