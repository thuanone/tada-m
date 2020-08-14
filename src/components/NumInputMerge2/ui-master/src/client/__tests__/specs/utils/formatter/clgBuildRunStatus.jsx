// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as buildModel from '../../../../../common/model/build-model';

import clgBuildRunStatus from '../../../../utils/formatter/clgBuildRunStatus';

describe('clgBuildRunStatus', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgBuildRunStatus.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {

    };
    expect(clgBuildRunStatus.value(props)).toEqual('clg.formatter.label.unknown');

    props = {
      status: buildModel.UIBuildRunStatus.FAILED,
      isDeleting: true,
    };
    expect(clgBuildRunStatus.value(props)).toEqual('clg.buildrun.status.deleting');

    props = {
      status: buildModel.UIBuildRunStatus.FAILED,
      isDeleting: false,
    };
    expect(clgBuildRunStatus.value(props)).toEqual('clg.buildrun.status.failed');

    props = {
      status: buildModel.UIBuildRunStatus.SUCCEEDED,
      isDeleting: false,
    };
    expect(clgBuildRunStatus.value(props)).toEqual('clg.buildrun.status.succeeded');

    props = {
      status: buildModel.UIBuildRunStatus.PENDING,
      isDeleting: false,
    };
    expect(clgBuildRunStatus.value(props)).toEqual('clg.buildrun.status.pending');

    props = {
      status: buildModel.UIBuildRunStatus.RUNNING,
      isDeleting: false,
      instanceStatus: 4,
    };
    expect(clgBuildRunStatus.value(props)).toEqual('clg.buildrun.status.running');
  });

  it('simple render', () => {
    const props = {
      status: buildModel.UIBuildRunStatus.PENDING,
      isDeleting: true,
    };
    render(props);
    expect(wrapper.childAt(0).props().className).toEqual('clg-item--status-loading-small');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (failed)', () => {
    const props = {
      status: buildModel.UIBuildRunStatus.FAILED
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(ErrorFilled24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (succeeded)', () => {
    const props = {
      status: buildModel.UIBuildRunStatus.SUCCEEDED
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(CheckmarkFilled24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (pending)', () => {
    const props = {
      status: buildModel.UIBuildRunStatus.PENDING
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(Time24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });


  it('simple render (running)', () => {
    const props = {
      status: buildModel.UIBuildRunStatus.RUNNING,
      instanceStatus: 3,
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(InProgress24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (default)', () => {
    const props = {
      status: 'foo'
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(Time24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });
});
