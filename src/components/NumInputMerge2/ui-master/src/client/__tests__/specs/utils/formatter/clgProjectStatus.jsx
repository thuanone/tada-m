// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as projectModel from '../../../../../common/model/project-model';

import clgProjectStatus from '../../../../utils/formatter/clgProjectStatus';

describe('clgProjectStatus', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgProjectStatus.render(props));
    instance = wrapper.instance();
  };

  it('simple value (active)', () => {
    let props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
    };
    expect(clgProjectStatus.value(props)).toEqual(`clg.project.state.active`);

    props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
      projectStatus: {
        domain: false
      }
    };
    expect(clgProjectStatus.value(props)).toEqual(`clg.project.state.provisioning`);

    props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
      projectStatus: {
        domain: true
      }
    };
    expect(clgProjectStatus.value(props)).toEqual(`clg.project.state.active`);
  });

  it('simple value (removed)', () => {
    const props = {
      state: projectModel.UIResourceInstanceStatus.REMOVED,
    };
    expect(clgProjectStatus.value(props)).toEqual(`clg.project.state.removed`);
  });

  it('simple value (provisioning)', () => {
    const props = {
      state: projectModel.UIResourceInstanceStatus.PROVISIONING,
    };
    expect(clgProjectStatus.value(props)).toEqual(`clg.project.state.provisioning`);
  });

  it('simple value (deleting)', () => {
    const props = {
      state: 'foo',
    };
    expect(clgProjectStatus.value(props)).toEqual(`clg.project.state.deleting`);
  });

  it('simple render (default)', () => {
    const props = {
      state: 'foo',
      projectStatus: {},
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg-item--status deleting');
  });

  it('simple render (no status loaded)', () => {
    const props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
    };

    render(props);
    expect(wrapper.props().className).toEqual('bx--skeleton__text');
  });

  it('simple render - is deleting - status loaded but no domain', () => {
    const props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
      isDeleting: true,
      projectStatus: {},
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg-item--status provisioning loading');
  });

  it('simple render - is deleting - status loaded but domain is ready', () => {
    const props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
      isDeleting: true,
      projectStatus: {
        domain: true,
      },
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg-item--status active loading');
  });

  it('simple render - status loaded but domain is ready', () => {
    const props = {
      state: projectModel.UIResourceInstanceStatus.ACTIVE,
      projectStatus: {
        domain: true,
      },
    };

    render(props);
    expect(wrapper.props().className).toEqual('clg-item--status active');
  });
});
