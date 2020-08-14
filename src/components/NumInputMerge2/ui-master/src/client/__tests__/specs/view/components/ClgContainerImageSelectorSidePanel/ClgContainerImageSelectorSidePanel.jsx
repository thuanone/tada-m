// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgContainerImageSelectorSidePanel from '../../../../../view/components/ClgContainerImageSelectorSidePanel/ClgContainerImageSelectorSidePanel';

describe('ClgContainerImageSelectorSidePanel', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgContainerImageSelectorSidePanel {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      allowInputDerivation: true,
      idPrefix: 'create-application',
      image: {},
      open: true,
      onClose: () => {},
      onChange: () => {},
      project: { id: 'some', region: 'us-south' },
      registryName: '',
    };

    render(props);
    expect(wrapper.html()).toContain('clg-container-image-selector-sidepanel');
  });

  it('simple render - close', () => {
    const props = {
      allowInputDerivation: true,
      idPrefix: 'create-application',
      image: {},
      open: false,
      onClose: () => {},
      onChange: () => {},
      project: { id: 'some', region: 'us-south' },
      registryName: '',
    };

    render(props);
    expect(wrapper.html()).not.toContain('clg-container-image-selector-sidepanel');
  });
});
