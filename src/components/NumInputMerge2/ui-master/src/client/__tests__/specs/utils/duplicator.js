import React from 'react';
import duplicator from 'utils/duplicator';
import { shallow } from 'enzyme';

describe('duplicator utils', () => {
  it('duplicates', () => {
    const results = duplicator(5, <p className="test">test</p>);
    const wrapper = shallow(<div>{results}</div>);
    expect(results.length).toBe(5);
    expect(wrapper.childAt(0).hasClass('test')).toBe(true);
    expect(wrapper.childAt(1).hasClass('test')).toBe(true);
    expect(wrapper.childAt(4).hasClass('test')).toBe(true);
  });
});
