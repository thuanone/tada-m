// tslint:disable:no-empty
import { shallow } from 'enzyme';

import clgAppLink from '../../../../utils/formatter/clgAppLink';

describe('clgAppLink', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgAppLink.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    const props = {
      id: 'foo',
      publicServiceUrl: 'https://some.foo/bar',
    };

    expect(clgAppLink.value(props)).toEqual(props.publicServiceUrl);
  });

  it('value - convert HTTP to HTTPS', () => {
    const props = {
      id: 'foo',
      publicServiceUrl: 'http://some.foo/bar',
    };

    expect(clgAppLink.value(props)).not.toEqual(props.publicServiceUrl);
    expect(clgAppLink.value(props)).toEqual('https://some.foo/bar');
  });


  it('simple render', () => {
    const props = {
      id: 'foo',
      publicServiceUrl: 'https://some.foo/bar',
    };

    render(props);
    expect(wrapper.childAt(0).name()).toEqual('a');
    expect(wrapper.childAt(0).hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.childAt(0).props().href).toEqual(props.publicServiceUrl);
  });

  it('render - convert HTTP to HTTPS', () => {
    const props = {
      id: 'foo',
      publicServiceUrl: 'http://foo.com/bar',
    };

    render(props);
    expect(wrapper.childAt(0).name()).toEqual('a');
    expect(wrapper.childAt(0).hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.childAt(0).props().href).toEqual('https://foo.com/bar');
  });

});
