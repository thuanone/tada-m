// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgTeaser from '../../../../../view/components/ClgTeaser/ClgTeaser';

describe('ClgTeaser', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgTeaser {...props} />);
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
    expect(wrapper.hasClass('clg--teaser')).toEqual(true);
    expect(wrapper.hasClass('clg--teaser-loading')).toEqual(false);
  });

  it('simple render - loading', () => {
    const props = {
      icon: 'some-icon',
      title: 'create-label',
      description: 'some-description',
      moreLabel: 'some-more-label',
      moreLink: 'some-more-link',
      loading: true,
    };

    render(props);
    expect(wrapper.hasClass('clg--teaser')).toEqual(true);
    expect(wrapper.hasClass('clg--teaser-loading')).toEqual(true);
    
  });
});
