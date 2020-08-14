// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as clgAppTrafficPercentage from '../../../../utils/formatter/clgAppTrafficPercentage';

describe('clgAppTrafficPercentage', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    wrapper = shallow(clgAppTrafficPercentage.render(overrides.revision, overrides.trafficTargets));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let revision = {};
    expect(clgAppTrafficPercentage.value(revision)).toEqual('-');

    revision = {
      name: 'foo',
    };
    const trafficTargets = {
      'foo': 90,
    };
    expect(clgAppTrafficPercentage.value(revision, trafficTargets)).toEqual('90%');
  });

  it('simple render', () => {
    let props = { };
    render(props);
    expect(wrapper.html()).toEqual('<span>-</span>');

    props = {
      revision: {
        name: 'foo',
      },
      trafficTargets: {
        'foo': 90,
      }
    };
    render(props);
    expect(wrapper.html()).toEqual(`<span class="rev_${props.revision.name}_traffic-percentage">90%</span>`);
    expect(wrapper.hasClass(`rev_${props.revision.name}_traffic-percentage`)).toBeTruthy();
  });

});
