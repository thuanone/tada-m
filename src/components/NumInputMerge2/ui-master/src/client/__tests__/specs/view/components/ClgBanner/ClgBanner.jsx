// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgBanner from '../../../../../view/components/ClgBanner/ClgBanner';

describe('ClgBanner', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgBanner {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      icon: 'some-icon',
      title: 'create-label',
      description: 'some-description',
      moreLabel: 'some-more-label',
      moreLink: 'some-more-link',
    };

    render(props);
    expect(wrapper.hasClass('clg--banner')).toEqual(true);
  });
});
