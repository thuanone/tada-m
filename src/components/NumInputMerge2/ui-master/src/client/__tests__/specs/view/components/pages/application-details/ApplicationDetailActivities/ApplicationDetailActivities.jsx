// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ApplicationDetailActivities from '../../../../../../../view/pages/application-details/ApplicationDetailActivities/ApplicationDetailActivities';

describe('ApplicationDetailActivities', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ApplicationDetailActivities {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      activities: [],
      handleCreateFn: () => { },
    };

    render(props);
    expect(wrapper.hasClass('application-invoke')).toEqual(true);
  });
});
