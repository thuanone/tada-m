// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgComponentCpu from '../../../../utils/formatter/clgComponentCpu';

describe('clgComponentCpu', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgComponentCpu.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      foo: 'bar',
    };

    expect(clgComponentCpu.value(props)).toEqual('-1');
  });

  it('simple value (application)', () => {
      let props = {
        kind: 'foo',
        template: {
          cpus: '0.1',
        },
      };
      expect(clgComponentCpu.value(props)).toEqual('0.1');
  });

  it('simple value (job)', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
      spec: {
        cpus: '2',
      },
      template: {
        cpus: '0.1',
      },
    };
    expect(clgComponentCpu.value(props)).toEqual('2');
  });

  it('simple render', () => {
    const props = {
      kind: UIEntityKinds.JOBDEFINITION,
      spec: {
        cpus: '2',
      },
    };

    render(props);
    expect(wrapper.html()).toEqual('<span>clg.components.label.cpu</span>');
  });

  it('simple render (empty value)', () => {
    const props = {
      kind: UIEntityKinds.JOBDEFINITION,
    };

    render(props);
    expect(wrapper.html()).toEqual('<span>clg.components.cpu.notavailable</span>');
  });
});
