// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgContainerImage from '../../../../../view/components/ClgContainerImage/ClgContainerImage';

describe('ClgContainerImage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgContainerImage {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      hasHelperText: true,
      idPrefix: 'create-application',
      image: {},
      nlsKeyPrefix: 'clg.application',
      onChange: () => {},
      project: { },
      allowToUsePublicRegistry: true,
    };

    render(props);
    expect(wrapper.html()).toContain('clg-container-image');
  });
});
