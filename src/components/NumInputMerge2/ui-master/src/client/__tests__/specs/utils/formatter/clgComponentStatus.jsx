// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgComponentStatus from '../../../../utils/formatter/clgComponentStatus';

describe('clgComponentStatus', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgComponentStatus.render(props));
    instance = wrapper.instance();
  };

  it('simple value (jobdef)', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
    };

    expect(clgComponentStatus.value(props)).toEqual('-');
  });

  it('simple value (app', () => {
      let props = {
        kind: UIEntityKinds.APPLICATION,
        status: 'foo',
        revision: {
          statusConditions: []
        },
      };
      expect(clgComponentStatus.value(props)).toEqual('clg.application.state.warning');

      props = {
        kind: UIEntityKinds.APPLICATION,
        status: 'FAILED',
        revision: {
          statusConditions: [
            {
              type: 'Ready',
              status: 'True'
            }
          ]
        },
      };
      expect(clgComponentStatus.value(props)).toEqual('clg.application.state.failed');

      props = {
        kind: UIEntityKinds.APPLICATION,
        status: 'READY',
      };
      expect(clgComponentStatus.value(props)).toEqual('clg.application.state.ready');
  });

  it('simple render', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
    };

    render(props);
    expect(wrapper.html()).toEqual('<span>-</span>');

    props = {
      kind: UIEntityKinds.JOBDEFINITION,
      isDeleting: true,
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('Loading');
    expect(wrapper.childAt(1).name()).toEqual('span');
  });
});
