// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as clgAppTrafficTags from '../../../../utils/formatter/clgAppTrafficTags';

describe('clgAppTrafficTags', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    wrapper = shallow(clgAppTrafficTags.render(overrides.revision, overrides.routingTags));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let revision = {};
    expect(clgAppTrafficTags.value(revision)).toEqual('');

    revision = {
      name: 'foo',
    };
    const routingTags = {
      'foo': ['latest', 'bar'],
    };
    expect(clgAppTrafficTags.value(revision, routingTags)).toEqual('latest bar');
  });

  it('simple render', () => {
    let props = { };
    render(props);
    expect(wrapper.html()).toEqual('<span>-</span>');

    props = {
      revision: {
        name: 'foo',
      },
      routingTags: {
        'foo': ['latest', 'bar'],
      }
    };
    render(props);
    expect(wrapper.hasClass(`rev_${props.revision.name}_traffic-tags`)).toBeTruthy();
    expect(wrapper.childAt(0).name()).toEqual('Tag');
    expect(wrapper.childAt(1).name()).toEqual('Tag');
  });

});
