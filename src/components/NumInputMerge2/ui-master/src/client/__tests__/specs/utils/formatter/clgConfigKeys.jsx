// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as clgConfigKeys from '../../../../utils/formatter/clgConfigKeys';

describe('clgConfigKeys', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    wrapper = shallow(clgConfigKeys.render(overrides));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let configItem = {};
    expect(clgConfigKeys.value(configItem)).toEqual('');

    configItem = {
      data: [{key: 'foo'}, {key: 'bar'}],
    };
    expect(clgConfigKeys.value(configItem)).toEqual('foo bar');
  });

  it('simple render', () => {
    let props = { };
    render(props);
    expect(wrapper.html()).toEqual('<span>-</span>');

    props = {
      data: [{key: 'foo'}, {key: 'bar'}],
    };
    render(props);
    expect(wrapper.html()).toEqual('<span>foo, bar</span>');
  });

});
