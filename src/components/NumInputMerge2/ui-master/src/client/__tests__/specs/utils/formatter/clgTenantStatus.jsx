// tslint:disable:no-empty
import { shallow } from 'enzyme';

import clgTenantStatus from '../../../../utils/formatter/clgTenantStatus';

describe('clgTenantStatus', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgTenantStatus.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    const props = {
      domain: true,
      tenant: true,
    };

    expect(clgTenantStatus.value(props)).toEqual('clg.project.state.tenant.ready');
  });


  it('simple render', () => {
    const props = {
      domain: true,
      tenant: true,
    };

    render(props);
    expect(wrapper.childAt(0)).toEqual({});
  });

  it('simple render - deploying', () => {
    const props = {
      domain: false,
      tenant: true,
    };

    render(props);
    expect(wrapper.childAt(0));
    expect(wrapper.childAt(0).hasClass('clg-item--status')).toBeTruthy();
    expect(wrapper.childAt(0).hasClass('deploying')).toBeTruthy();
  });
});
