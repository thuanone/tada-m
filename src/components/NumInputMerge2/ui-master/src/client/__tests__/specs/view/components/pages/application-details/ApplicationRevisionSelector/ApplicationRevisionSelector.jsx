// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ApplicationRevisionSelector from '../../../../../../../view/pages/application-details/ApplicationRevisionSelector/ApplicationRevisionSelector';

describe('ApplicationRevisionSelector', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ApplicationRevisionSelector {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      application: {},
      revision: { name: 'foo' },
      handleChange: () => { },
    };

    render(props);
    expect(wrapper.hasClass('application-revision-loading')).toEqual(true);
  });
});
