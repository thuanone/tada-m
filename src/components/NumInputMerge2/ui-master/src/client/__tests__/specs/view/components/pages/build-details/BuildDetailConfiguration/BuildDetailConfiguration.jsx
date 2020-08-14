// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import { BuildDetailConfiguration } from 'view/pages/build-details/BuildDetailConfiguration/BuildDetailConfiguration';
const config = window.armada.config;

describe('BuildDetailConfiguration', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({
      location: { pathname: `${config.proxyRoot}project/abc/def/build/xyz/configuration` },
    }, overrides || {});
    wrapper = shallow(<BuildDetailConfiguration {...props}>{null}</BuildDetailConfiguration>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      build: { 
        name: 'foo-123',
        outputCredentials: 'some-creds',
        outputImage: 'foo-image',
        sourceUrl: 'source-foo',
        strategyName: 'strategy-foo',
        strategyKind: 'kind-foo',
      },
      match: {
        params: {
          buildId: 'foo12',
          projectId: 'bar34',
          regionId: 'some-region',
        },
      },
      projectStatus: {tenant: true, domain: true},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-build-detail-page--configuration');
  });
});
