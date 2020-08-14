// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as commonModel from '../../../../../common/model/common-model';

import clgEnvValue from '../../../../utils/formatter/clgEnvValue';

describe('clgEnvValue', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgEnvValue.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      value: 'bar',
      kind: commonModel.IUIEnvItemKind.LITERAL,
    };
    expect(clgEnvValue.value(props)).toEqual(props.value);

    props = {
      value: 'bar',
      kind: commonModel.IUIEnvItemKind.PREDEFINED,
    };
    expect(clgEnvValue.value(props)).toEqual(props.value);

    props = {
      valuesFrom: {},
      kind: commonModel.IUIEnvItemKind.MAPREF,
    };
    expect(clgEnvValue.value(props)).toEqual('clg.formatter.label.env.value.allfrom');

    props = {
      kind: commonModel.IUIEnvItemKind.UNSUPPORTED_FROM,
    };
    expect(clgEnvValue.value(props)).toEqual('clg.formatter.label.env.value.unsupported');

    props = {
      kind: commonModel.IUIEnvItemKind.UNSUPPORTED,
    };
    expect(clgEnvValue.value(props)).toEqual('clg.formatter.label.env.value.unsupported');

    props = {
      kind: 'something',
    };
    expect(clgEnvValue.value(props)).toEqual('clg.formatter.label.env.value.unsupported');
  });

  it('simple render (unknown kind)', () => {
    const props = {
      value: 'foo',
      kind: 'something',
    };

    render(props);
    expect(wrapper.html()).toEqual('<div><span class="bx--type-caption clg-item--caption">clg.formatter.label.env.value.unsupported</span></div>');
  });


  it('simple render (literal)', () => {
    const props = {
      value: 'bar',
      kind: commonModel.IUIEnvItemKind.LITERAL,
    };

    render(props);
    expect(wrapper.html()).toEqual('<div><span class="bx--type-caption clg-item--caption">bar</span></div>');
  });
});
