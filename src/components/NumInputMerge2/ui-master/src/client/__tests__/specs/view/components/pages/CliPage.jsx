// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import CliPage from '../../../../../view/pages/CliPage';

describe('CliPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<CliPage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {};

    render(props);
    expect(wrapper.hasClass('cli-page')).toEqual(true);
  });
});
