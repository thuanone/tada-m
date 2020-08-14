// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgProjectExpirationWarnings from '../../../../../view/components/ClgProjectExpirationWarnings/ClgProjectExpirationWarnings';

describe('ClgProjectExpirationWarnings', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgProjectExpirationWarnings {...props} />);
    instance = wrapper.instance();
  };

  it('simple render (inline)', () => {
    const props = {
      projects: [ {
        projectStatus: {
          expireTimestamp: Date.now(),
        }
      }],
      type: 'inline',
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg--expiration-warning');
    expect(wrapper.childAt(0).name()).toEqual('InlineNotification');
  });

  it('simple render (toast)', () => {
    const props = {
      projects: [ {
        projectStatus: {
          expireTimestamp: Date.now(),
        }
      }],
      type: 'toast',
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg--expiration-warning');
    expect(wrapper.childAt(0).name()).toEqual('ToastNotification');
  });

  it('simple render (inline) - warning', () => {
    const props = {
      projects: [ {
        projectStatus: {
          expireTimestamp: Date.now() + 25 * 60 * 60 * 1000,
        }
      }],
      type: 'inline',
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg--expiration-warning');
    expect(wrapper.childAt(0).name()).toEqual('InlineNotification');
  });

  it('simple render (toast) - warning - but will not be shown', () => {
    const props = {
      hideWarnings: true,
      projects: [ {
        projectStatus: {
          expireTimestamp: Date.now() + 25 * 60 * 60 * 1000,
        }
      }],
      type: 'toast',
    };

    render(props);
    expect(wrapper.html()).toEqual('<div class=\"clg--expiration-warning\"></div>');
  });

  it('simple render - no warnings', () => {
    const props = {
      projects: [ {
        projectStatus: { }
      }],
      type: 'inline',
    };

    render(props);
    expect(wrapper.html()).toEqual('<div class=\"clg--expiration-warning\"></div>');
  });
});
