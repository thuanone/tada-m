// tslint:disable:no-empty
import { shallow } from 'enzyme';

import clgAppInstances from '../../../../utils/formatter/clgAppInstances';

describe('clgAppInstances', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    wrapper = shallow(clgAppInstances.render(overrides));
    instance = wrapper.instance();
  };

  it('raw value', () => {
    let props = [ ];
    expect(clgAppInstances.rawValue(props)).toEqual(0);

    props = [ {} ];
    expect(clgAppInstances.rawValue(props)).toEqual(1);

    props = [ {}, {} ];
    expect(clgAppInstances.rawValue(props)).toEqual(2);
  });

  it('simple value', () => {
    let props = [ ];
    expect(clgAppInstances.value(props)).toEqual('clg.application.runningInstances');

    props = [ {} ];
    expect(clgAppInstances.value(props)).toEqual('clg.application.runningInstance');

    props = [ {}, {} ];
    expect(clgAppInstances.value(props)).toEqual('clg.application.runningInstances');
  });

  it('simple render', () => {
    const props = [ ];
    render(props);
    expect(wrapper.hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.hasClass('clg-item--caption')).toBeTruthy();
    expect(wrapper.hasClass('resource-status--instances')).toBeTruthy();
    expect(wrapper.childAt(0).name()).toBe('TooltipDefinition');
  });

});
