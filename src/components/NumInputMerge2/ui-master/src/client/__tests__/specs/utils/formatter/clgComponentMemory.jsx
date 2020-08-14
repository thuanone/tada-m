// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgComponentMemory from '../../../../utils/formatter/clgComponentMemory';

describe('clgComponentMemory', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgComponentMemory.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      foo: 'bar',
    };

    expect(clgComponentMemory.value(props)).toEqual('-1');
  });

  it('simple value (application)', () => {
      let props = {
        kind: 'foo',
        template: {
          memory: '1GiB',
        },
      };
      expect(clgComponentMemory.value(props)).toEqual('1GiB');
  });

  it('simple value (job)', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
      spec: {
        memory: '2GiB',
      },
      template: {
        memory: '1GiB',
      },
    };
    expect(clgComponentMemory.value(props)).toEqual('2GiB');
  });

  it('simple render', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION
    };

    render(props);
    expect(wrapper.html()).toEqual('<span>clg.components.memory.notavailable</span>');

    props = {
      kind: UIEntityKinds.APPLICATION
    };
    render(props);
    expect(wrapper.html()).toEqual('<span>clg.components.memory.notavailable</span>');


    props = {
      kind: 'foo'
    };
    render(props);
    expect(wrapper.html()).toEqual('<span>clg.components.memory.notavailable</span>');
  });
});
