import React from 'react';
import TestUtils from '../../../helpers/utils';
import ComponentLoading from 'view/common/ComponentLoading';

describe('ComponentLoading', () => {
  let renderer;
  let comp;

  const getRenderOutput = () => {
    comp = TestUtils.wrap(renderer.getRenderOutput());
  };
  const render = () => {
    renderer = TestUtils.createRenderer();
    renderer.render(<ComponentLoading />);
    getRenderOutput();
  };

  it('renders', () => {
    render();
  });
});
