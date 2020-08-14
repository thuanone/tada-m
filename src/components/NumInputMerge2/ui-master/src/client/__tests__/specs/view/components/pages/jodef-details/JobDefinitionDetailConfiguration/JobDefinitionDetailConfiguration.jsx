// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';

import { JobDefinitionDetailConfiguration } from 'view/pages/jobdef-details/JobDefinitionDetailConfiguration/JobDefinitionDetailConfiguration';
const config = window.armada.config;

describe('JobDefinitionDetailConfiguration', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({
      location: { pathname: `${config.proxyRoot}project/abc/def/jobdef/xyz/configuration` },
    }, overrides || {});
    wrapper = shallow(<Router><JobDefinitionDetailConfiguration {...props}>{null}</JobDefinitionDetailConfiguration></Router>);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      jobDefinition: { 
        name: 'foo-123',
        spec: {
          args: [],
          env: [],
          memory: 1073741824,
        }
      },
      handleNewRevision: (newRevision) => { },
      match: {
        params: {
          jobDefinitionId: 'foo12',
          projectId: 'bar34',
          regionId: 'some-region',
        },
      },
      projectStatus: {tenant: true, domain: true},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-jobdef-detail-page--configuration');
  });
});
