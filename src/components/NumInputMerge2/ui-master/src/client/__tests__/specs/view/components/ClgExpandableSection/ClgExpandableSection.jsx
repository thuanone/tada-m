// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgExpandableSection from '../../../../../view/components/ClgExpandableSection/ClgExpandableSection';

describe('ClgExpandableSection', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgExpandableSection {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      className: 'bx--col-lg-9 bx--col-md-5 bx--col-sm-2',
      collapsedHeightCss: 'auto',
      expandedHeightCss: 'auto',
      id: 'job-command',
      isExpanded: false,
      maxHeight: 0,
      noItemsText: 'some empty text',
      items: ['foo', 'bar'],
      light: false,
      maxCollapsedItems: 3,
      renderItemFn: (item) => {return item},
    };

    render(props);
    expect(wrapper.hasClass('clg-expandable-section')).toEqual(true);
  });
});
