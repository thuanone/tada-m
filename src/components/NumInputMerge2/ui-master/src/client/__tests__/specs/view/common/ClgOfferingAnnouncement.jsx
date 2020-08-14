// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgOfferingAnnouncement from '../../../../view/common/ClgOfferingAnnouncement';

describe('ClgOfferingAnnouncement', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgOfferingAnnouncement {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = { };

    render(props);
    expect(wrapper.html()).toContain('');
  });
});
