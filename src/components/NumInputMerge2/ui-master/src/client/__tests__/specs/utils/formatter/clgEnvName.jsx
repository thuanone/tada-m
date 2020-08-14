// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as commonModel from '../../../../../common/model/common-model';

import clgEnvName from '../../../../utils/formatter/clgEnvName';

describe('clgEnvName', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgEnvName.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.KEYREF,
    };
    expect(clgEnvName.value(props)).toEqual(props.name);

    props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.LITERAL,
    };
    expect(clgEnvName.value(props)).toEqual(props.name);

    props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.PREDEFINED,
    };
    expect(clgEnvName.value(props)).toEqual(props.name);

    props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.PREDEFINED,
    };
    expect(clgEnvName.value(props)).toEqual(props.name);

    props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.MAPREF,
    };
    expect(clgEnvName.value(props)).toEqual('clg.formatter.label.env.name.mapref');

    props = {
      name: 'foo',
      prefix: 'bar',
      kind: commonModel.IUIEnvItemKind.MAPREF,
    };
    expect(clgEnvName.value(props)).toEqual('bar');

    props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.UNSUPPORTED_FROM,
    };
    expect(clgEnvName.value(props)).toEqual('clg.formatter.label.env.name.mapref');

    props = {
      name: 'foo',
      prefix: 'bar',
      kind: commonModel.IUIEnvItemKind.UNSUPPORTED_FROM,
    };
    expect(clgEnvName.value(props)).toEqual('bar');

    props = {
      name: 'foo',
      prefix: 'bar',
      kind: 'something',
    };
    expect(clgEnvName.value(props)).toEqual('clg.formatter.label.env.name.none');
  });

  it('simple render (unknown kind)', () => {
    const props = {
      name: 'foo',
      kind: 'something',
    };

    render(props);
    expect(wrapper.html()).toEqual('<div><span class="bx--type-caption clg-item--caption">clg.formatter.label.env.name.none</span></div>');
  });


  it('simple render (literal)', () => {
    const props = {
      name: 'foo',
      kind: commonModel.IUIEnvItemKind.LITERAL,
    };

    render(props);
    expect(wrapper.html()).toEqual('<div><span class="bx--type-caption clg-item--caption">foo</span></div>');
  });
});
