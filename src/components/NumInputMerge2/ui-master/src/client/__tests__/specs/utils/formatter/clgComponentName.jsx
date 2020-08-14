// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgComponentName from '../../../../utils/formatter/clgComponentName';

describe('clgComponentName', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgComponentName.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      foo: 'bar',
    };

    expect(clgComponentName.value(props)).toBeUndefined();
  });

  it('simple value ', () => {
      let props = {
        name: 'foo',
      };
      expect(clgComponentName.value(props)).toEqual('foo');
  });

  it('simple render', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
      name: 'foo',
    };

    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(ListChecked24)');
    expect(wrapper.childAt(1).hasClass('clg-item--caption')).toBeTruthy();

    props = {
      kind: UIEntityKinds.APPLICATION,
      name: 'foo',
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(Code24)');
    expect(wrapper.childAt(1).hasClass('clg-item--caption')).toBeTruthy();



    props = {
      kind: UIEntityKinds.JOBRUN,
      name: 'foo',
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(Task24)');
    expect(wrapper.childAt(1).hasClass('clg-item--caption')).toBeTruthy();
  });

  it('simple render (no value)', () => {
    let props = {
      kind: 'foo',
    };
    render(props);
    expect(wrapper.childAt(0).hasClass('clg-item--caption')).toBeTruthy();
  });
});
