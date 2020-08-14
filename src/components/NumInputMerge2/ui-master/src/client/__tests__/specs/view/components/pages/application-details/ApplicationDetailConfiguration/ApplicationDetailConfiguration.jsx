// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import { ApplicationDetailConfiguration } from 'view/pages/application-details/ApplicationDetailConfiguration/ApplicationDetailConfiguration';
const config = window.armada.config;

describe('ApplicationDetailConfiguration', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({
      location: { pathname: `${config.proxyRoot}project/abc/def/application/xyz/configuration` },
    }, overrides || {});
    wrapper = shallow(<ApplicationDetailConfiguration {...props}>{null}</ApplicationDetailConfiguration>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      application: { 
        revision: {
          name: 'foo-123',
          memory: 1073741824,
        }
      },
      handleNewRevision: (newRevision) => { },
      match: {
        params: {
          applicationId: 'foo12',
          projectId: 'bar34',
          regionId: 'some-region',
        },
      },
      projectStatus: {tenant: true, domain: true},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-application-detail-page--configuration');
  });
});
