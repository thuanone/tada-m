// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import OverviewPage from '../../../../../view/pages/OverviewPage';

describe('OverviewPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<OverviewPage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {};

    render(props);
    expect(wrapper.hasClass('overview-page')).toEqual(true);
    expect(wrapper.hasClass('clg-overview-page')).toEqual(true);
  });
});
