// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import { ApplicationActivity } from '../../../../../../../view/pages/application-details/ApplicationDetailActivities/ApplicationActivity';

describe('ApplicationActivity', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ApplicationActivity {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      activity: {
        collapsed: false,
        id: 123,
        resolved: true,
        responseBody: 'Hello World!',
        success: true,
        startTime: Date.now() - 1000 * 30,
        title: 'foo-bar',
        type: 'unknown',
      },
    };

    render(props);
    expect(wrapper.html()).toContain('application-invoke--invocations__result invocation-result');
  });
});
