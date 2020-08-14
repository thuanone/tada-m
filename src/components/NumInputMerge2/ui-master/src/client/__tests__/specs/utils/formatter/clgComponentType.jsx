// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgComponentType from '../../../../utils/formatter/clgComponentType';

describe('clgComponentType', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgComponentType.render(props));
    instance = wrapper.instance();
  };

  it('simple value (jobdef)', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
    };

    expect(clgComponentType.value(props)).toEqual('clg.components.type.jobdefinition');
  });

  it('simple value (app)', () => {
      let props = {
        kind: UIEntityKinds.APPLICATION,
        status: 'ready'
      };
      expect(clgComponentType.value(props)).toEqual('clg.components.type.application');
  });

  it('simple render', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
    };

    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">clg.components.type.jobdefinition</span>');

    props = {
      kind: UIEntityKinds.APPLICATION,
    };
    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">clg.components.type.application</span>');

    props = {
      kind: 'bar',
    };
    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">clg.components.type.application</span>');
  });
});
