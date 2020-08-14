// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import ProjectListPage from '../../../../../../view/pages/project-list/ProjectListPage';

describe('ProjectListPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<Router><ProjectListPage {...props} /></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      history: { push: jest.fn(), },
    };

    render(props);
    expect(wrapper.html()).toContain('page list-page clg-project-list-page');
  });
});
