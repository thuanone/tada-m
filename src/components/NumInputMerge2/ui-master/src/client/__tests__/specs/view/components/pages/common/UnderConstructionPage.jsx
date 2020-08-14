// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import UnderConstructionPage from '../../../../../../view/pages/common/UnderConstructionPage';

describe('UnderConstructionPage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<UnderConstructionPage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {};

    render(props);
    expect(wrapper.hasClass('page')).toEqual(true);
    expect(wrapper.hasClass('under-construction')).toEqual(true);
  });
});
