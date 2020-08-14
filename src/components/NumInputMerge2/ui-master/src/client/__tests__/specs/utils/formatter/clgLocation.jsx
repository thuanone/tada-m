// tslint:disable:no-empty
import { shallow } from 'enzyme';

import clgLocation from '../../../../utils/formatter/clgLocation';

describe('clgLocation', () => {
  let wrapper;
  let instance;

  const render = props => {
    wrapper = shallow(clgLocation.render(props.location));
    instance = wrapper.instance();
  };

  it('simple value (empty)', () => {
    let props = {
      location: undefined,
    };
    expect(clgLocation.value(props.location)).toEqual('');

    props = {
      location: '',
    };
    expect(clgLocation.value(props.location)).toEqual('');
  });

  it('simple value', () => {
    let props = {
      location: 'foo',
    };
    expect(clgLocation.value(props.location)).toEqual('clg.common.region.foo');

    props = {
      location: '  foo ',
    };
    expect(clgLocation.value(props.location)).toEqual('clg.common.region.foo');
  });

  it('simple render (empty)', () => {
    let props = {
      location: '',
    };
    render(props);
    expect(wrapper.html()).toEqual('<span></span>');

    props = {
      location: undefined,
    };
    render(props);
    expect(wrapper.html()).toEqual('<span></span>');
  });

  it('simple render', () => {
    let props = {
      location: 'foo',
    };
    render(props);
    expect(wrapper.html()).toEqual('<span>clg.common.region.foo</span>');

    props = {
      location: '  foo ',
    };
    render(props);
    expect(wrapper.html()).toEqual('<span>clg.common.region.foo</span>');
  });
});
