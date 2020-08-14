// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgDeferredValue from '../../../../utils/formatter/clgDeferredValue';

describe('clgDeferredValue', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgDeferredValue.render(props.valueToShow));
    instance = wrapper.instance();
  };

  it('simple value ', () => {
    let valueToShow = '';
    expect(clgDeferredValue.value(valueToShow)).toEqual('');
  });

  it('simple value (set)', () => {
    let valueToShow = 'foo';
    expect(clgDeferredValue.value(valueToShow)).toEqual(valueToShow);
  });

  it('simple render (loading)', () => {
    const props = {
      valueToShow: '',
    };

    render(props);
    expect(wrapper.name()).toEqual('p');
    expect(wrapper.html()).toEqual('<p class=\"bx--skeleton__text\" style=\"width:100%\"></p>');
  });

  it('simple render', () => {
    const props = {
      valueToShow: 'foo',
    };

    render(props);
    expect(wrapper.html()).toEqual(`<span>${props.valueToShow}</span>`);
  });
});
