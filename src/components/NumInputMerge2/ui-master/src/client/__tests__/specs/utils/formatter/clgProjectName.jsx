// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as projectModel from '../../../../../common/model/project-model';

import clgProjectName from '../../../../utils/formatter/clgProjectName';

describe('clgProjectName', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgProjectName.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      name: 'foo',
    };
    expect(clgProjectName.value(props)).toEqual(props.name);
  });

  it('simple render (default)', () => {
    const props = {
      name: 'foo',
      projectStatus: {},
    };

    render(props);
    expect(wrapper.html()).toEqual('<span>foo</span>');
  });


  it('simple render - status loaded project is about to expire', () => {
    const props = {
      name: 'foo',
      projectStatus: {
        expireTimestamp: Date.now(),
      },
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg-item--status urgent');
  });
});
