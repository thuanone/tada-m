// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ColigoForbiddenPage from '../../../../../../view/pages/common/ColigoForbiddenPage';

describe('ColigoForbiddenPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ColigoForbiddenPage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {};

    render(props);
    expect(wrapper.hasClass('page')).toEqual(true);
    expect(wrapper.hasClass('overview-page')).toEqual(true);
    expect(wrapper.hasClass('clg-forbidden-page')).toEqual(true);
  });
});
