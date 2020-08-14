// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgEmptyStateCard from '../../../../../view/components/ClgEmptyStateCard/ClgEmptyStateCard';

describe('ClgEmptyStateCard', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgEmptyStateCard {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      createLabel: 'create-label',
      description: 'some-description',
      descriptionExtended: 'some-extended-description',
      handleCreateFn: () => { },
      handleMoreFn: () => { },
      icon: {},
      id: 'my-message',
      moreLabel: 'some-more-label',
      title: 'some-title',
    };

    render(props);
    expect(wrapper.childAt(0).name()).toBe('Card');
  });
});
