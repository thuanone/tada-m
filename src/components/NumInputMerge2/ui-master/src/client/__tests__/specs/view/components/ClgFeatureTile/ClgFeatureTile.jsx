// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgFeatureTile from '../../../../../view/components/ClgFeatureTile/ClgFeatureTile';

describe('ClgFeatureTile', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgFeatureTile {...props} />);
    instance = wrapper.instance();
  };

  it('simple render - clickable tile', () => {
    const props = {
      image: 'some-icon',
      title: 'create-label',
      description: 'some-description',
      moreLink: 'some-more-link',
    };

    render(props);
    expect(wrapper.hasClass('clg--feature-tile')).toEqual(true);
    expect(wrapper.name()).toBe('ClickableTile');
  });

  it('simple render', () => {
    const props = {
      image: 'some-icon',
      title: 'create-label',
      description: 'some-description',
    };

    render(props);
    expect(wrapper.hasClass('clg--feature-tile')).toEqual(true);
    expect(wrapper.name()).toBe('Tile');
  });

});
