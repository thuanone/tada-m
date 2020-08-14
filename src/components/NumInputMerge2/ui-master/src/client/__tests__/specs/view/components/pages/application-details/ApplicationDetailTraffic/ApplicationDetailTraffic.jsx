// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import { ApplicationDetailTraffic } from 'view/pages/application-details/ApplicationDetailTraffic/ApplicationDetailTraffic';
const config = window.armada.config;

describe('ApplicationDetailTraffic', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({
      location: { pathname: `${config.proxyRoot}project/abc/def/application/xyz/traffic` },
    }, overrides || {});
    wrapper = shallow(<ApplicationDetailTraffic {...props}>{null}</ApplicationDetailTraffic>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      application: { 
        revision: {
          id: 'some-ap-3oc4ms-2',
          name: 'some-ap-3oc4ms-2',
          memory: 1073741824,
        }
      },
      revisions: [
        {
          revision: {
            id: 'some-ap-3oc4ms-2',
            name: 'some-ap-3oc4ms-2',
            memory: 1073741824,
          }
        }
      ],
      route: {
        routingTags: [
          {'some-ap-3oc4ms-2': ["latest"]}
        ],
        trafficTargets: {
          'some-ap-3oc4ms-2': 100
        }
      },
      match: {
        params: {
          applicationId: 'foo12',
          projectId: 'bar34',
          regionId: 'some-region',
        },
      },
    };

    render(props);
    expect(wrapper.html()).toContain('clg-application-detail-page--traffic');
  });
});
