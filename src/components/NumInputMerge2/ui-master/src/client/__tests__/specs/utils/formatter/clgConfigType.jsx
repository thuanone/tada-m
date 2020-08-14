// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgConfigType from '../../../../utils/formatter/clgConfigType';

describe('clgConfigType', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgConfigType.render(props));
    instance = wrapper.instance();
  };

  it('simple value (confmap)', () => {
    let props = {
      kind: UIEntityKinds.CONFMAP,
    };

    expect(clgConfigType.value(props)).toEqual('clg.components.type.confmap');
  });

  it('simple value (secret)', () => {
      let props = {
        kind: UIEntityKinds.SECRET,
      };
      expect(clgConfigType.value(props)).toEqual('clg.components.type.secret');
  });

  it('simple render', () => {
    let props = {
      kind: UIEntityKinds.CONFMAP,
    };

    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">clg.components.type.confmap</span>');

    props = {
      kind: UIEntityKinds.SECRET,
    };
    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">clg.components.type.secret</span>');

    props = {
      kind: 'bar',
    };
    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">clg.components.type.confmap</span>');
  });
});
