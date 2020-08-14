// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ErrorPage from '../../../../../../view/pages/common/ErrorPage';

describe('ErrorPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ErrorPage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {};

    render(props);
    expect(wrapper.hasClass('page')).toEqual(true);
    expect(wrapper.hasClass('error-page')).toEqual(true);
  });
});
