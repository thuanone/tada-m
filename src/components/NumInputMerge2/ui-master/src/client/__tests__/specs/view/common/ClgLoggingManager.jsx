import React from 'react';
import TestUtils from '../../../helpers/utils';
import ClgLoggingManager from 'view/common/ClgLoggingManager';

describe('ClgLoggingManager', () => {
  let renderer;
  let comp;

  const getRenderOutput = () => {
    comp = TestUtils.wrap(renderer.getRenderOutput());
  };
  const render = () => {
    renderer = TestUtils.createRenderer();
    renderer.render(<ClgLoggingManager />);
    getRenderOutput();
  };

  it('renders', () => {
    render();
  });
});
