import React from 'react';
import TestUtils from '../../../helpers/utils';
import PageHeaderSkeleton from 'view/common/PageHeaderSkeleton';

describe('PageHeaderSkeleton', () => {
  let renderer;
  let comp;

  const getRenderOutput = () => {
    comp = TestUtils.wrap(renderer.getRenderOutput());
  };
  const render = () => {
    renderer = TestUtils.createRenderer();
    renderer.render(<PageHeaderSkeleton />);
    getRenderOutput();
  };

  it('renders', () => {
    render();
    expect(comp.is()).toBe('div');
    expect(comp.className()).toBe('armada-header-wrapper');
    expect(comp.find('SkeletonText').count()).toBe(3);
    expect(comp.find('IconSkeleton').count()).toBe(1);
    expect(comp.find('ButtonSkeleton').count()).toBe(1);
  });
});
