// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ApplicationDetailInstances from '../../../../../../../view/pages/application-details/ApplicationDetailInstances/ApplicationDetailInstances';

describe('ApplicationDetailInstances', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ApplicationDetailInstances {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      appName: 'foo',
      show: true,
      runningInstances: [{}],
    };

    render(props);
    expect(wrapper.hasClass('clg-application-detail-page--instances')).toEqual(true);
  });
});
