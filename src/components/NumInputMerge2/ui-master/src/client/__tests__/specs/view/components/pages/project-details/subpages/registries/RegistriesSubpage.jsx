// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import RegistriesSubpage from '../../../../../../../../view/pages/project-details/subpages/registries/RegistriesSubpage';

describe('RegistriesSubpage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<RegistriesSubpage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      errorHandler: (err) => { },
      history: { push: () => {} },
      projectId: 'some-projectId',
      regionId: 'some-region',
    };

    render(props);
    expect(wrapper.props().className).toEqual('registries-subpage');
  });
});
